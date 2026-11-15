import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dataDir = path.resolve(process.cwd(), 'data');
export const uploadsDir = path.join(dataDir, 'uploads');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'portfolio.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      full_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT NOT NULL,
      title_line TEXT NOT NULL,
      headline TEXT NOT NULL,
      short_intro TEXT NOT NULL,
      profession TEXT NOT NULL,
      about_location TEXT NOT NULL,
      about_description TEXT NOT NULL,
      profile_image_url TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_location TEXT NOT NULL,
      languages_json TEXT NOT NULL,
      interests_json TEXT NOT NULL,
      cv_filename TEXT NOT NULL,
      cv_storage_path TEXT,
      cv_updated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_key TEXT NOT NULL,
      focus_label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      company TEXT NOT NULL,
      period TEXT NOT NULL,
      location TEXT NOT NULL,
      responsibilities_json TEXT NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      university TEXT NOT NULL,
      period TEXT NOT NULL,
      cgpa TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      issuer TEXT NOT NULL,
      period TEXT NOT NULL,
      credential_note TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unread',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visitor_daily (
      day TEXT PRIMARY KEY,
      visits INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS visitor_sessions (
      visitor_key TEXT PRIMARY KEY,
      last_seen INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Idempotent migration: ensure username column exists on existing DBs
  const cols = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'username')) {
    db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);');

  seedInitialData();
}

export function logActivity(action: string, details: string, actor = 'System'): void {
  const stmt = db.prepare(
    'INSERT INTO activity_logs (action, details, actor, created_at) VALUES (?, ?, ?, ?)'
  );
  stmt.run(action, details, actor, new Date().toISOString());
}

function seedInitialData(): void {
  const now = new Date().toISOString();

  const adminUsername = (process.env.ADMIN_USER_ID || 'himel').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'morshedhimel1212@gmail.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'novoresume';

  const existingUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existingUsers.cnt === 0) {
    db.prepare(
      'INSERT INTO users (username, email, password_hash, role, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(adminUsername, adminEmail, hashPassword(adminPassword), 'admin', 'Morshed Habib Himel', now, now);
  } else {
    // Migrate pre-existing bootstrap admin account that has no username yet
    const legacyAdmin = db
      .prepare('SELECT id FROM users WHERE username IS NULL ORDER BY id ASC LIMIT 1')
      .get() as { id: number } | undefined;
    if (legacyAdmin) {
      db.prepare(
        'UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?'
      ).run(adminUsername, hashPassword(adminPassword), now, legacyAdmin.id);
    }
  }

  const existingProfile = db.prepare('SELECT COUNT(*) as cnt FROM profile').get() as { cnt: number };
  if (existingProfile.cnt === 0) {
    db.prepare(`
      INSERT INTO profile (
        id, full_name, title_line, headline, short_intro, profession,
        about_location, about_description, profile_image_url,
        contact_email, contact_phone, contact_location,
        languages_json, interests_json,
        cv_filename, cv_storage_path, cv_updated_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'Morshed Habib Himel',
      'Professional Accountant | Financial Management | Microsoft Excel',
      'Turning Financial Data into Meaningful Business Insights.',
      'I am a detail-oriented and analytical Accounting Professional experienced in financial records management, ledger maintenance, accounts reconciliation, bookkeeping, and financial reporting.',
      'Accountant',
      'Palashpara, Gaibandha Sadar, Gaibandha, Bangladesh.',
      'An analytical accounting professional with practical experience in accounting operations, financial record management, cash handling, bank reconciliation, and Microsoft Excel. Passionate about financial accuracy, business operations, and continuous professional development.',
      'default:portrait',
      'morshedhimel1212@gmail.com',
      '+8801313723732',
      'Gaibandha, Bangladesh',
      JSON.stringify([{ language: 'English', level: 'Professional Working Proficiency' }]),
      JSON.stringify(['Singing', 'Sports', 'Travelling']),
      'Morshed_Habib_Himel_CV.pdf',
      null,
      now,
      now
    );
  }

  const existingSkills = db.prepare('SELECT COUNT(*) as cnt FROM skills').get() as { cnt: number };
  if (existingSkills.cnt === 0) {
    const insertSkill = db.prepare(
      'INSERT INTO skills (name, category, description, icon_key, focus_label, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const seedSkills = [
      [
        'Financial Accounting',
        'Core Accounting',
        'Accurate recording of daily financial transactions, general ledger structuring, expense logging, and period-end financial summaries.',
        'Landmark',
        'Core Competency',
        1,
      ],
      [
        'Accounts Reconciliation',
        'Audit & Control',
        'Bank statement matching, sales register verification, DSR collection audits, and resolving ledger discrepancies systematically.',
        'Scale',
        'Verification & Control',
        2,
      ],
      [
        'Microsoft Excel',
        'Data & Reporting',
        'Structured financial spreadsheets, pivot summaries, formula-driven reconciliation sheets, and daily operational reporting.',
        'FileSpreadsheet',
        'Analytical Tooling',
        3,
      ],
      [
        'Bookkeeping',
        'Ledger Operations',
        'Systematic voucher entries, stock ledger maintenance, petty cash tracking, and organized day-to-day financial documentation.',
        'BookOpen',
        'Daily Practice',
        4,
      ],
      [
        'Billing & Invoicing',
        'Payables & Receivables',
        'Vendor bill verification, payment processing workflows, invoice accuracy checks, and timely settlement tracking.',
        'Receipt',
        'Operations Finance',
        5,
      ],
      [
        'Problem Solving',
        'Analytical Mindset',
        'Root-cause investigation of cash and stock variances, workflow coordination across service teams, and disciplined decision support.',
        'Compass',
        'Analytical Approach',
        6,
      ],
    ] as const;

    for (const s of seedSkills) {
      insertSkill.run(s[0], s[1], s[2], s[3], s[4], s[5]);
    }
  }

  const existingExp = db.prepare('SELECT COUNT(*) as cnt FROM experiences').get() as { cnt: number };
  if (existingExp.cnt === 0) {
    const insertExp = db.prepare(
      'INSERT INTO experiences (role, company, period, location, responsibilities_json, is_current, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertExp.run(
      'Service In-Charge',
      'Bazaz Uttara Motors',
      'November 2026 – Present',
      'Gaibandha, Bangladesh',
      JSON.stringify([
        'Supervised daily service activities.',
        'Managed daily service operations.',
        'Maintained customer relationships.',
        'Ensured customer satisfaction.',
      ]),
      1,
      1
    );
    insertExp.run(
      'Accountant',
      'Rabab Traders – A distribution house of Robi Axiata Ltd.',
      'May 2026 – August 2026',
      'Bangladesh',
      JSON.stringify([
        'Managed daily cash collections from DSRs.',
        'Reconciled sales registers.',
        'Maintained stock ledgers.',
        'Handled daily bank deposits.',
        'Logged expenses and prepared sales summaries.',
      ]),
      0,
      2
    );
    insertExp.run(
      'Jr. Executive – Accounts',
      'Steadfast Courier Limited',
      'September 2025 – December 2025',
      'Dhaka, Bangladesh',
      JSON.stringify([
        'Managed daily accounting transactions.',
        'Maintained voucher entries and ledgers.',
        'Handled petty cash.',
        'Verified vendor bills.',
        'Processed payments.',
        'Assisted with bank reconciliations.',
      ]),
      0,
      3
    );
  }

  const existingEdu = db.prepare('SELECT COUNT(*) as cnt FROM education').get() as { cnt: number };
  if (existingEdu.cnt === 0) {
    db.prepare(
      'INSERT INTO education (degree, institution, university, period, cgpa, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      'BBA – Accounting',
      'Gaibandha Government College',
      'National University, Bangladesh',
      'June 2019 – June 2023',
      'CGPA: 3.18 / 4.00',
      1
    );
  }

  const existingCerts = db.prepare('SELECT COUNT(*) as cnt FROM certifications').get() as { cnt: number };
  if (existingCerts.cnt === 0) {
    const insertCert = db.prepare(
      'INSERT INTO certifications (title, issuer, period, credential_note, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    insertCert.run(
      'AI Basic Course',
      'Department of Youth Development (DYD), Bangladesh',
      'October 2026 – November 2026',
      'Foundational training in practical AI literacy, digital productivity workflows, and modern office automation.',
      1
    );
    insertCert.run(
      'Computer Application & MS Excel Certification',
      'Bangladesh Technical Education Board, Dhaka',
      'January 2020 – June 2020',
      'Comprehensive technical certification covering spreadsheet modeling, office applications, and structured data management.',
      2
    );
  }

  const existingSocials = db.prepare('SELECT COUNT(*) as cnt FROM social_links').get() as { cnt: number };
  if (existingSocials.cnt === 0) {
    const insertSocial = db.prepare(
      'INSERT INTO social_links (platform, label, url, sort_order) VALUES (?, ?, ?, ?)'
    );
    insertSocial.run('Email', 'morshedhimel1212@gmail.com', 'mailto:morshedhimel1212@gmail.com', 1);
    insertSocial.run('Phone', '+8801313723732', 'tel:+8801313723732', 2);
    insertSocial.run('LinkedIn', 'LinkedIn Profile', 'https://www.linkedin.com', 3);
  }

  const existingActivity = db.prepare('SELECT COUNT(*) as cnt FROM activity_logs').get() as { cnt: number };
  if (existingActivity.cnt === 0) {
    logActivity('Portfolio Initialized', 'Portfolio database seeded with verified academic and accounting records.', 'System');
  }
}
