import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  db,
  hashPassword,
  initDatabase,
  logActivity,
  uploadsDir,
  verifyPassword,
} from './server/db.ts';
import {
  createSession,
  destroySession,
  extractTokenFromRequest,
  getAuthenticatedAdmin,
  requireAdmin,
  SESSION_COOKIE_NAME,
  type AuthenticatedRequest,
} from './server/auth.ts';
import { generatePortfolioPdf } from './server/pdfGenerator.ts';

initDatabase();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' }));

function getPortfolioSnapshot() {
  const profileRow = db.prepare('SELECT * FROM profile WHERE id = 1').get() as Record<string, unknown>;
  const skills = db.prepare('SELECT * FROM skills ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;
  const expRows = db.prepare('SELECT * FROM experiences ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;
  const education = db.prepare('SELECT * FROM education ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;
  const certifications = db.prepare('SELECT * FROM certifications ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;
  const socialLinks = db.prepare('SELECT * FROM social_links ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;

  let languages: Array<{ language: string; level: string }> = [];
  let interests: string[] = [];
  try {
    languages = JSON.parse(String(profileRow.languages_json || '[]'));
  } catch {
    languages = [];
  }
  try {
    interests = JSON.parse(String(profileRow.interests_json || '[]'));
  } catch {
    interests = [];
  }

  const experiences = expRows.map((row) => {
    let responsibilities: string[] = [];
    try {
      responsibilities = JSON.parse(String(row.responsibilities_json || '[]'));
    } catch {
      responsibilities = [];
    }
    return {
      id: row.id,
      role: row.role,
      company: row.company,
      period: row.period,
      location: row.location,
      responsibilities,
      is_current: Boolean(row.is_current),
      sort_order: row.sort_order,
    };
  });

  return {
    profile: {
      full_name: String(profileRow.full_name),
      title_line: String(profileRow.title_line),
      headline: String(profileRow.headline),
      short_intro: String(profileRow.short_intro),
      profession: String(profileRow.profession),
      about_location: String(profileRow.about_location),
      about_description: String(profileRow.about_description),
      profile_image_url: String(profileRow.profile_image_url),
      contact_email: String(profileRow.contact_email),
      contact_phone: String(profileRow.contact_phone),
      contact_location: String(profileRow.contact_location),
      languages,
      interests,
      cv_filename: String(profileRow.cv_filename),
      has_custom_cv: Boolean(profileRow.cv_storage_path),
      cv_updated_at: String(profileRow.cv_updated_at),
      updated_at: String(profileRow.updated_at),
    },
    skills,
    experiences,
    education,
    certifications,
    socialLinks,
  };
}

function setSessionCookie(req: express.Request, res: express.Response, token: string): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${60 * 60 * 24 * 7}`,
    isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(req: express.Request, res: express.Response): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

app.get('/api/portfolio', (_req, res) => {
  try {
    res.json(getPortfolioSnapshot());
  } catch (error) {
    console.error('Failed to load portfolio:', error);
    res.status(500).json({ error: 'Unable to load portfolio data.' });
  }
});

app.post('/api/analytics/visit', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const visitorId =
      typeof req.body?.visitorId === 'string' && req.body.visitorId.length >= 8
        ? req.body.visitorId.slice(0, 64)
        : crypto
            .createHash('sha256')
            .update(`${req.ip || 'anon'}:${req.headers['user-agent'] || ''}`)
            .digest('hex')
            .slice(0, 32);

    const key = `${today}:${visitorId}`;
    const existing = db.prepare('SELECT visitor_key FROM visitor_sessions WHERE visitor_key = ?').get(key);
    if (!existing) {
      db.prepare('INSERT INTO visitor_sessions (visitor_key, last_seen) VALUES (?, ?)').run(key, Date.now());
      db.prepare(`
        INSERT INTO visitor_daily (day, visits) VALUES (?, 1)
        ON CONFLICT(day) DO UPDATE SET visits = visits + 1
      `).run(today);
    }

    const totalRow = db.prepare('SELECT COALESCE(SUM(visits), 0) as total FROM visitor_daily').get() as {
      total: number;
    };
    res.json({ totalVisitors: totalRow.total });
  } catch (error) {
    console.error('Visit tracking failed:', error);
    res.status(500).json({ error: 'Analytics update failed.' });
  }
});

app.post('/api/contact', (req, res) => {
  try {
    const name = typeof req.body?.sender_name === 'string' ? req.body.sender_name.trim() : '';
    const email = typeof req.body?.sender_email === 'string' ? req.body.sender_email.trim() : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'Please enter your name (2–120 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (subject.length < 2 || subject.length > 160) {
      res.status(400).json({ error: 'Please include a short subject.' });
      return;
    }
    if (message.length < 10 || message.length > 4000) {
      res.status(400).json({ error: 'Message must be between 10 and 4000 characters.' });
      return;
    }

    const now = new Date().toISOString();
    const info = db
      .prepare(
        'INSERT INTO contact_messages (sender_name, sender_email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(name, email, subject, message, 'unread', now);

    logActivity('Contact Inquiry Received', `New message from ${name} (${subject})`, name);
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error('Contact form submission failed:', error);
    res.status(500).json({ error: 'Unable to send message right now.' });
  }
});

app.get('/api/cv/download', (_req, res) => {
  try {
    const row = db.prepare('SELECT cv_filename, cv_storage_path FROM profile WHERE id = 1').get() as {
      cv_filename: string;
      cv_storage_path: string | null;
    };
    const safeFilename = (row.cv_filename || 'Morshed_Habib_Himel_CV.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (row.cv_storage_path) {
      const resolved = path.join(uploadsDir, path.basename(row.cv_storage_path));
      if (fs.existsSync(resolved)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        fs.createReadStream(resolved).pipe(res);
        return;
      }
    }

    const snapshot = getPortfolioSnapshot();
    const pdfBuffer = generatePortfolioPdf({
      profile: snapshot.profile,
      skills: snapshot.skills as Array<{ name: string; category: string; description: string }>,
      experiences: snapshot.experiences as Array<{
        role: string;
        company: string;
        period: string;
        location: string;
        responsibilities: string[];
      }>,
      education: snapshot.education as Array<{
        degree: string;
        institution: string;
        university: string;
        period: string;
        cgpa: string;
      }>,
      certifications: snapshot.certifications as Array<{
        title: string;
        issuer: string;
        period: string;
      }>,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('CV download failed:', error);
    res.status(500).json({ error: 'Unable to prepare CV download.' });
  }
});

app.get('/api/uploads/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename || '');
  if (!safeName || safeName.includes('..')) {
    res.status(400).json({ error: 'Invalid filename.' });
    return;
  }
  const target = path.join(uploadsDir, safeName);
  if (!fs.existsSync(target)) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }
  res.sendFile(target);
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/auth/login', (req, res) => {
  try {
    const rawIdentifier =
      req.body?.userId ?? req.body?.identifier ?? req.body?.username ?? req.body?.email ?? '';
    const identifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      res.status(400).json({ error: 'User ID and password are required.' });
      return;
    }

    const user = db
      .prepare('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?')
      .get(identifier, identifier) as
      | {
          id: number;
          username: string | null;
          email: string;
          password_hash: string;
          role: string;
          full_name: string;
        }
      | undefined;

    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid User ID or password.' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Administrator role required.' });
      return;
    }

    const { token } = createSession(user.id, user.role);
    setSessionCookie(req, res, token);
    logActivity(
      'Admin Sign-In',
      `Administrator session started for ${user.username || user.email}`,
      user.full_name
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service error.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  if (!admin) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({ authenticated: true, user: admin });
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractTokenFromRequest(req);
  const admin = getAuthenticatedAdmin(req);
  destroySession(token);
  clearSessionCookie(req, res);
  if (admin) {
    logActivity('Admin Sign-Out', `Session terminated for ${admin.email}`, admin.full_name);
  }
  res.json({ ok: true });
});

// ============================================================================
// PROTECTED ADMIN ROUTES
// ============================================================================

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  try {
    const totalVisitorsRow = db.prepare('SELECT COALESCE(SUM(visits), 0) as total FROM visitor_daily').get() as {
      total: number;
    };
    const today = new Date().toISOString().slice(0, 10);
    const todayRow = db.prepare('SELECT COALESCE(visits, 0) as visits FROM visitor_daily WHERE day = ?').get(today) as
      | { visits: number }
      | undefined;

    const visitorTrend = db
      .prepare('SELECT day, visits FROM visitor_daily ORDER BY day DESC LIMIT 14')
      .all() as Array<{ day: string; visits: number }>;

    const totalMessages = (db.prepare('SELECT COUNT(*) as cnt FROM contact_messages').get() as { cnt: number }).cnt;
    const unreadMessages = (
      db.prepare("SELECT COUNT(*) as cnt FROM contact_messages WHERE status = 'unread'").get() as { cnt: number }
    ).cnt;
    const skillsCount = (db.prepare('SELECT COUNT(*) as cnt FROM skills').get() as { cnt: number }).cnt;
    const expCount = (db.prepare('SELECT COUNT(*) as cnt FROM experiences').get() as { cnt: number }).cnt;
    const certCount = (db.prepare('SELECT COUNT(*) as cnt FROM certifications').get() as { cnt: number }).cnt;
    const eduCount = (db.prepare('SELECT COUNT(*) as cnt FROM education').get() as { cnt: number }).cnt;
    const recentActivities = db
      .prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 12')
      .all();

    res.json({
      stats: {
        totalVisitors: totalVisitorsRow.total,
        todayVisitors: todayRow?.visits ?? 0,
        totalMessages,
        unreadMessages,
        skillsCount,
        expCount,
        certCount,
        eduCount,
      },
      visitorTrend: visitorTrend.reverse(),
      recentActivities,
    });
  } catch (error) {
    console.error('Admin overview failed:', error);
    res.status(500).json({ error: 'Unable to load dashboard metrics.' });
  }
});

app.put('/api/admin/profile', requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const b = req.body || {};
    const requiredStrings = [
      'full_name',
      'title_line',
      'headline',
      'short_intro',
      'profession',
      'about_location',
      'about_description',
      'contact_email',
      'contact_phone',
      'contact_location',
    ] as const;

    for (const key of requiredStrings) {
      if (typeof b[key] !== 'string' || !b[key].trim()) {
        res.status(400).json({ error: `Field "${key}" cannot be empty.` });
        return;
      }
    }

    const languages = Array.isArray(b.languages) ? b.languages : [];
    const interests = Array.isArray(b.interests)
      ? b.interests.map((x: unknown) => String(x).trim()).filter(Boolean)
      : [];
    const profileImageUrl =
      typeof b.profile_image_url === 'string' && b.profile_image_url.trim()
        ? b.profile_image_url.trim()
        : 'default:portrait';

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE profile SET
        full_name = ?,
        title_line = ?,
        headline = ?,
        short_intro = ?,
        profession = ?,
        about_location = ?,
        about_description = ?,
        profile_image_url = ?,
        contact_email = ?,
        contact_phone = ?,
        contact_location = ?,
        languages_json = ?,
        interests_json = ?,
        updated_at = ?
      WHERE id = 1
    `).run(
      b.full_name.trim(),
      b.title_line.trim(),
      b.headline.trim(),
      b.short_intro.trim(),
      b.profession.trim(),
      b.about_location.trim(),
      b.about_description.trim(),
      profileImageUrl,
      b.contact_email.trim(),
      b.contact_phone.trim(),
      b.contact_location.trim(),
      JSON.stringify(languages),
      JSON.stringify(interests),
      now
    );

    logActivity('Profile Updated', 'Personal, About, and Contact details saved.', req.adminUser?.full_name || 'Admin');
    res.json(getPortfolioSnapshot());
  } catch (error) {
    console.error('Update profile failed:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.post('/api/admin/upload-image', requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { filename, mimeType, dataBase64 } = req.body || {};
    const allowed: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = allowed[String(mimeType || '').toLowerCase()];
    if (!ext) {
      res.status(400).json({ error: 'Only JPG, PNG, or WebP images are supported.' });
      return;
    }
    if (typeof dataBase64 !== 'string' || !dataBase64) {
      res.status(400).json({ error: 'Missing image payload.' });
      return;
    }
    const cleanB64 = dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanB64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Profile image must be under 5 MB.' });
      return;
    }

    const storedName = `profile-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer);

    const publicUrl = `/api/uploads/${storedName}`;
    db.prepare('UPDATE profile SET profile_image_url = ?, updated_at = ? WHERE id = 1').run(
      publicUrl,
      new Date().toISOString()
    );

    logActivity(
      'Profile Photo Replaced',
      `Uploaded new profile portrait (${String(filename || storedName)}).`,
      req.adminUser?.full_name || 'Admin'
    );
    res.json({ profile_image_url: publicUrl });
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(500).json({ error: 'Failed to upload profile image.' });
  }
});

app.post('/api/admin/upload-cv', requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { filename, mimeType, dataBase64 } = req.body || {};
    if (String(mimeType || '').toLowerCase() !== 'application/pdf') {
      res.status(400).json({ error: 'CV file must be a PDF document.' });
      return;
    }
    if (typeof dataBase64 !== 'string' || !dataBase64) {
      res.status(400).json({ error: 'Missing PDF data.' });
      return;
    }
    const cleanB64 = dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanB64, 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'CV PDF must be under 10 MB.' });
      return;
    }
    if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      res.status(400).json({ error: 'Uploaded file is not a valid PDF document.' });
      return;
    }

    const storedName = `cv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.pdf`;
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer);

    const displayName =
      typeof filename === 'string' && filename.trim()
        ? filename.trim().replace(/[^a-zA-Z0-9._-]/g, '_')
        : 'Morshed_Habib_Himel_CV.pdf';

    const now = new Date().toISOString();
    db.prepare('UPDATE profile SET cv_filename = ?, cv_storage_path = ?, cv_updated_at = ?, updated_at = ? WHERE id = 1').run(
      displayName.endsWith('.pdf') ? displayName : `${displayName}.pdf`,
      storedName,
      now,
      now
    );

    logActivity('CV PDF Replaced', `Uploaded custom CV (${displayName}).`, req.adminUser?.full_name || 'Admin');
    res.json({ ok: true, cv_filename: displayName, has_custom_cv: true, cv_updated_at: now });
  } catch (error) {
    console.error('CV upload failed:', error);
    res.status(500).json({ error: 'Failed to upload CV PDF.' });
  }
});

app.post('/api/admin/reset-cv', requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE profile SET cv_filename = ?, cv_storage_path = NULL, cv_updated_at = ?, updated_at = ? WHERE id = 1'
    ).run('Morshed_Habib_Himel_CV.pdf', now, now);

    logActivity('CV Reset', 'Switched CV download to live auto-generated PDF.', req.adminUser?.full_name || 'Admin');
    res.json({ ok: true, cv_filename: 'Morshed_Habib_Himel_CV.pdf', has_custom_cv: false, cv_updated_at: now });
  } catch (error) {
    console.error('Reset CV failed:', error);
    res.status(500).json({ error: 'Failed to reset CV.' });
  }
});

// SKILLS CRUD
app.post('/api/admin/skills', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, category, description, icon_key, focus_label, sort_order } = req.body || {};
  if (!name?.trim() || !category?.trim() || !description?.trim()) {
    res.status(400).json({ error: 'Skill name, category, and description are required.' });
    return;
  }
  const info = db
    .prepare(
      'INSERT INTO skills (name, category, description, icon_key, focus_label, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(
      name.trim(),
      category.trim(),
      description.trim(),
      String(icon_key || 'Landmark'),
      String(focus_label || 'Core Competency').trim(),
      Number(sort_order ?? 10)
    );
  logActivity('Skill Added', `Added skill "${name.trim()}".`, req.adminUser?.full_name || 'Admin');
  res.status(201).json({ id: info.lastInsertRowid, skills: getPortfolioSnapshot().skills });
});

app.put('/api/admin/skills/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { name, category, description, icon_key, focus_label, sort_order } = req.body || {};
  if (!name?.trim() || !category?.trim() || !description?.trim()) {
    res.status(400).json({ error: 'Skill name, category, and description are required.' });
    return;
  }
  db.prepare(
    'UPDATE skills SET name = ?, category = ?, description = ?, icon_key = ?, focus_label = ?, sort_order = ? WHERE id = ?'
  ).run(
    name.trim(),
    category.trim(),
    description.trim(),
    String(icon_key || 'Landmark'),
    String(focus_label || 'Core Competency').trim(),
    Number(sort_order ?? 1),
    id
  );
  logActivity('Skill Updated', `Updated skill "${name.trim()}".`, req.adminUser?.full_name || 'Admin');
  res.json({ skills: getPortfolioSnapshot().skills });
});

app.delete('/api/admin/skills/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT name FROM skills WHERE id = ?').get(id) as { name: string } | undefined;
  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
  logActivity('Skill Deleted', `Removed skill "${existing?.name || id}".`, req.adminUser?.full_name || 'Admin');
  res.json({ skills: getPortfolioSnapshot().skills });
});

// EXPERIENCE CRUD
app.post('/api/admin/experiences', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { role, company, period, location, responsibilities, is_current, sort_order } = req.body || {};
  if (!role?.trim() || !company?.trim() || !period?.trim()) {
    res.status(400).json({ error: 'Role, company, and period are required.' });
    return;
  }
  const respList = Array.isArray(responsibilities)
    ? responsibilities.map((r: unknown) => String(r).trim()).filter(Boolean)
    : [];
  const info = db
    .prepare(
      'INSERT INTO experiences (role, company, period, location, responsibilities_json, is_current, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      role.trim(),
      company.trim(),
      period.trim(),
      String(location || '').trim(),
      JSON.stringify(respList),
      is_current ? 1 : 0,
      Number(sort_order ?? 1)
    );
  logActivity('Experience Added', `Added role "${role.trim()}" at ${company.trim()}.`, req.adminUser?.full_name || 'Admin');
  res.status(201).json({ id: info.lastInsertRowid, experiences: getPortfolioSnapshot().experiences });
});

app.put('/api/admin/experiences/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { role, company, period, location, responsibilities, is_current, sort_order } = req.body || {};
  if (!role?.trim() || !company?.trim() || !period?.trim()) {
    res.status(400).json({ error: 'Role, company, and period are required.' });
    return;
  }
  const respList = Array.isArray(responsibilities)
    ? responsibilities.map((r: unknown) => String(r).trim()).filter(Boolean)
    : [];
  db.prepare(
    'UPDATE experiences SET role = ?, company = ?, period = ?, location = ?, responsibilities_json = ?, is_current = ?, sort_order = ? WHERE id = ?'
  ).run(
    role.trim(),
    company.trim(),
    period.trim(),
    String(location || '').trim(),
    JSON.stringify(respList),
    is_current ? 1 : 0,
    Number(sort_order ?? 1),
    id
  );
  logActivity('Experience Updated', `Updated "${role.trim()}" at ${company.trim()}.`, req.adminUser?.full_name || 'Admin');
  res.json({ experiences: getPortfolioSnapshot().experiences });
});

app.delete('/api/admin/experiences/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT role, company FROM experiences WHERE id = ?').get(id) as
    | { role: string; company: string }
    | undefined;
  db.prepare('DELETE FROM experiences WHERE id = ?').run(id);
  logActivity(
    'Experience Deleted',
    `Removed "${existing?.role || id}" (${existing?.company || ''}).`,
    req.adminUser?.full_name || 'Admin'
  );
  res.json({ experiences: getPortfolioSnapshot().experiences });
});

// EDUCATION CRUD
app.post('/api/admin/education', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { degree, institution, university, period, cgpa, sort_order } = req.body || {};
  if (!degree?.trim() || !institution?.trim() || !period?.trim()) {
    res.status(400).json({ error: 'Degree, institution, and period are required.' });
    return;
  }
  db.prepare(
    'INSERT INTO education (degree, institution, university, period, cgpa, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    degree.trim(),
    institution.trim(),
    String(university || '').trim(),
    period.trim(),
    String(cgpa || '').trim(),
    Number(sort_order ?? 1)
  );
  logActivity('Education Added', `Added "${degree.trim()}" at ${institution.trim()}.`, req.adminUser?.full_name || 'Admin');
  res.status(201).json({ education: getPortfolioSnapshot().education });
});

app.put('/api/admin/education/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { degree, institution, university, period, cgpa, sort_order } = req.body || {};
  if (!degree?.trim() || !institution?.trim() || !period?.trim()) {
    res.status(400).json({ error: 'Degree, institution, and period are required.' });
    return;
  }
  db.prepare(
    'UPDATE education SET degree = ?, institution = ?, university = ?, period = ?, cgpa = ?, sort_order = ? WHERE id = ?'
  ).run(
    degree.trim(),
    institution.trim(),
    String(university || '').trim(),
    period.trim(),
    String(cgpa || '').trim(),
    Number(sort_order ?? 1),
    id
  );
  logActivity('Education Updated', `Updated "${degree.trim()}".`, req.adminUser?.full_name || 'Admin');
  res.json({ education: getPortfolioSnapshot().education });
});

app.delete('/api/admin/education/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM education WHERE id = ?').run(id);
  logActivity('Education Deleted', `Removed education record #${id}.`, req.adminUser?.full_name || 'Admin');
  res.json({ education: getPortfolioSnapshot().education });
});

// CERTIFICATIONS CRUD
app.post('/api/admin/certifications', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { title, issuer, period, credential_note, sort_order } = req.body || {};
  if (!title?.trim() || !issuer?.trim() || !period?.trim()) {
    res.status(400).json({ error: 'Certificate title, issuer, and period are required.' });
    return;
  }
  db.prepare(
    'INSERT INTO certifications (title, issuer, period, credential_note, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(
    title.trim(),
    issuer.trim(),
    period.trim(),
    String(credential_note || '').trim(),
    Number(sort_order ?? 1)
  );
  logActivity('Certificate Added', `Added certificate "${title.trim()}".`, req.adminUser?.full_name || 'Admin');
  res.status(201).json({ certifications: getPortfolioSnapshot().certifications });
});

app.put('/api/admin/certifications/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { title, issuer, period, credential_note, sort_order } = req.body || {};
  if (!title?.trim() || !issuer?.trim() || !period?.trim()) {
    res.status(400).json({ error: 'Certificate title, issuer, and period are required.' });
    return;
  }
  db.prepare(
    'UPDATE certifications SET title = ?, issuer = ?, period = ?, credential_note = ?, sort_order = ? WHERE id = ?'
  ).run(
    title.trim(),
    issuer.trim(),
    period.trim(),
    String(credential_note || '').trim(),
    Number(sort_order ?? 1),
    id
  );
  logActivity('Certificate Updated', `Updated certificate "${title.trim()}".`, req.adminUser?.full_name || 'Admin');
  res.json({ certifications: getPortfolioSnapshot().certifications });
});

app.delete('/api/admin/certifications/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT title FROM certifications WHERE id = ?').get(id) as { title: string } | undefined;
  db.prepare('DELETE FROM certifications WHERE id = ?').run(id);
  logActivity('Certificate Deleted', `Removed certificate "${existing?.title || id}".`, req.adminUser?.full_name || 'Admin');
  res.json({ certifications: getPortfolioSnapshot().certifications });
});

// SOCIAL LINKS CRUD
app.post('/api/admin/socials', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { platform, label, url, sort_order } = req.body || {};
  if (!platform?.trim() || !label?.trim() || !url?.trim()) {
    res.status(400).json({ error: 'Platform, label, and URL are required.' });
    return;
  }
  db.prepare('INSERT INTO social_links (platform, label, url, sort_order) VALUES (?, ?, ?, ?)').run(
    platform.trim(),
    label.trim(),
    url.trim(),
    Number(sort_order ?? 1)
  );
  logActivity('Social Link Added', `Added ${platform.trim()} link.`, req.adminUser?.full_name || 'Admin');
  res.status(201).json({ socialLinks: getPortfolioSnapshot().socialLinks });
});

app.put('/api/admin/socials/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { platform, label, url, sort_order } = req.body || {};
  if (!platform?.trim() || !label?.trim() || !url?.trim()) {
    res.status(400).json({ error: 'Platform, label, and URL are required.' });
    return;
  }
  db.prepare('UPDATE social_links SET platform = ?, label = ?, url = ?, sort_order = ? WHERE id = ?').run(
    platform.trim(),
    label.trim(),
    url.trim(),
    Number(sort_order ?? 1),
    id
  );
  logActivity('Social Link Updated', `Updated ${platform.trim()} link.`, req.adminUser?.full_name || 'Admin');
  res.json({ socialLinks: getPortfolioSnapshot().socialLinks });
});

app.delete('/api/admin/socials/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM social_links WHERE id = ?').run(id);
  logActivity('Social Link Deleted', `Removed social link #${id}.`, req.adminUser?.full_name || 'Admin');
  res.json({ socialLinks: getPortfolioSnapshot().socialLinks });
});

// CONTACT MESSAGES MANAGEMENT
app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
  res.json({ messages });
});

app.patch('/api/admin/messages/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '');
  if (!['unread', 'read', 'archived'].includes(status)) {
    res.status(400).json({ error: 'Invalid status value.' });
    return;
  }
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
  logActivity('Message Status Updated', `Marked message #${id} as ${status}.`, req.adminUser?.full_name || 'Admin');
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
  res.json({ messages });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  logActivity('Message Deleted', `Deleted contact message #${id}.`, req.adminUser?.full_name || 'Admin');
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
  res.json({ messages });
});

// ADMIN PASSWORD / CREDENTIAL ROTATION
app.put('/api/admin/security/password', requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const newEmail = typeof req.body?.newEmail === 'string' ? req.body.newEmail.trim().toLowerCase() : '';
    const newUsername =
      typeof req.body?.newUsername === 'string' ? req.body.newUsername.trim().toLowerCase() : '';

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.adminUser!.id) as {
      id: number;
      username: string | null;
      email: string;
      password_hash: string;
    };

    if (!verifyPassword(currentPassword, user.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }

    const updatedUsername = newUsername || user.username || 'himel';
    const updatedEmail = newEmail || user.email;
    const updatedHash = newPassword ? hashPassword(newPassword) : user.password_hash;
    db.prepare(
      'UPDATE users SET username = ?, email = ?, password_hash = ?, updated_at = ? WHERE id = ?'
    ).run(updatedUsername, updatedEmail, updatedHash, new Date().toISOString(), user.id);

    logActivity(
      'Security Credentials Updated',
      `Updated administrator account (${updatedUsername}).`,
      req.adminUser?.full_name || 'Admin'
    );
    res.json({ ok: true, username: updatedUsername, email: updatedEmail });
  } catch (error) {
    console.error('Security update failed:', error);
    res.status(500).json({ error: 'Failed to update security settings.' });
  }
});

// ============================================================================
// VITE / STATIC SERVING
// ============================================================================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use('/admin/assets', express.static(path.join(distDir, 'assets')));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
