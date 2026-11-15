import type {
  AdminOverviewData,
  AdminUser,
  ContactMessageItem,
  PortfolioData,
} from '@/src/types/portfolio';
import { generateBrowserPdfBlob } from './browserPdf';
import {
  getStaticOverview,
  readStaticStore,
  sha256Hex,
  writeStaticStore,
} from './staticFallback';

let memoryToken: string | null = null;
let backendStatus: 'unknown' | 'online' | 'static' = 'unknown';

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

export function getAuthToken(): string | null {
  return memoryToken;
}

function isLikelyStaticHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.endsWith('github.io') ||
    host.endsWith('gitlab.io') ||
    window.location.protocol === 'file:'
  );
}

class BackendUnavailableError extends Error {
  constructor() {
    super('STATIC_HOST_MODE');
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (backendStatus === 'static' || isLikelyStaticHost()) {
    backendStatus = 'static';
    throw new BackendUnavailableError();
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (memoryToken) {
    headers.set('Authorization', `Bearer ${memoryToken}`);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    if (backendStatus === 'unknown') {
      backendStatus = 'static';
      throw new BackendUnavailableError();
    }
    throw new Error('Network connection failed.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Static hosts (e.g. GitHub Pages) return HTML 404 for /api/*
    if (backendStatus === 'unknown' || res.status === 404) {
      backendStatus = 'static';
      throw new BackendUnavailableError();
    }
    throw new Error(`Unexpected response (${res.status}).`);
  }

  backendStatus = 'online';
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchPortfolio(): Promise<PortfolioData> {
  try {
    return await apiFetch<PortfolioData>('/api/portfolio');
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      return readStaticStore().portfolio;
    }
    throw err;
  }
}

export async function trackVisit(visitorId: string): Promise<{ totalVisitors: number }> {
  try {
    return await apiFetch<{ totalVisitors: number }>('/api/analytics/visit', {
      method: 'POST',
      body: JSON.stringify({ visitorId }),
    });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      const today = new Date().toISOString().slice(0, 10);
      const visitFlagKey = `mh_visit_${today}`;
      let counted = false;
      try {
        counted = Boolean(sessionStorage.getItem(visitFlagKey));
        if (!counted) sessionStorage.setItem(visitFlagKey, '1');
      } catch {
        counted = false;
      }
      if (!counted) {
        store.visitors[today] = (store.visitors[today] || 0) + 1;
        writeStaticStore(store);
      }
      const total = Object.values(store.visitors).reduce((a, b) => a + b, 0);
      return { totalVisitors: total };
    }
    return { totalVisitors: 0 };
  }
}

export async function submitContactMessage(payload: {
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; id: number }> {
  try {
    return await apiFetch<{ ok: boolean; id: number }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      const nextId = (store.messages[0]?.id || 0) + 1;
      const now = new Date().toISOString();
      store.messages.unshift({
        id: nextId,
        sender_name: payload.sender_name,
        sender_email: payload.sender_email,
        subject: payload.subject,
        message: payload.message,
        status: 'unread',
        created_at: now,
      });
      store.activities.unshift({
        id: Date.now(),
        action: 'Contact Inquiry Received',
        details: `New message from ${payload.sender_name} (${payload.subject})`,
        actor: payload.sender_name,
        created_at: now,
      });
      writeStaticStore(store);
      return { ok: true, id: nextId };
    }
    throw err;
  }
}

export async function downloadCvFile(): Promise<void> {
  if (backendStatus !== 'static' && !isLikelyStaticHost()) {
    try {
      const probe = await fetch('/api/cv/download', { method: 'GET' });
      const ct = probe.headers.get('content-type') || '';
      if (probe.ok && ct.includes('application/pdf')) {
        const blob = await probe.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Morshed_Habib_Himel_CV.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // fall through to static PDF generation
    }
  }

  const store = readStaticStore();
  const filename = store.portfolio.profile.cv_filename || 'Morshed_Habib_Himel_CV.pdf';
  if (store.customCvDataUrl) {
    const a = document.createElement('a');
    a.href = store.customCvDataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  const blob = generateBrowserPdfBlob(store.portfolio);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const STATIC_SESSION_KEY = 'mh_static_admin_session';

export async function checkAuthSession(): Promise<{ authenticated: boolean; user: AdminUser | null }> {
  try {
    return await apiFetch<{ authenticated: boolean; user: AdminUser | null }>('/api/auth/me');
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      try {
        const raw = sessionStorage.getItem(STATIC_SESSION_KEY);
        if (raw) {
          return { authenticated: true, user: JSON.parse(raw) as AdminUser };
        }
      } catch {
        // ignore
      }
      return { authenticated: false, user: null };
    }
    throw err;
  }
}

export async function loginAdmin(
  identifier: string,
  password: string
): Promise<{ token: string; user: AdminUser }> {
  try {
    const res = await apiFetch<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setAuthToken(res.token);
    return res;
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      const idLower = identifier.trim().toLowerCase();
      const expectedUsername = (store.adminUsername || 'himel').toLowerCase();
      const expectedEmail = (store.adminEmail || 'morshedhimel1212@gmail.com').toLowerCase();
      const hash = await sha256Hex(password);
      if ((idLower === expectedUsername || idLower === expectedEmail) && hash === store.adminAuthHash) {
        const user: AdminUser = {
          id: 1,
          username: expectedUsername,
          email: expectedEmail,
          role: 'admin',
          full_name: store.portfolio.profile.full_name,
        };
        try {
          sessionStorage.setItem(STATIC_SESSION_KEY, JSON.stringify(user));
        } catch {
          // ignore
        }
        return { token: 'static-session', user };
      }
      throw new Error('Invalid User ID or password.');
    }
    throw err;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore in static mode
  }
  try {
    sessionStorage.removeItem(STATIC_SESSION_KEY);
  } catch {
    // ignore
  }
  setAuthToken(null);
}

export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  try {
    return await apiFetch<AdminOverviewData>('/api/admin/overview');
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      return getStaticOverview(readStaticStore());
    }
    throw err;
  }
}

export async function updateAdminProfile(payload: Record<string, unknown>): Promise<PortfolioData> {
  try {
    return await apiFetch<PortfolioData>('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      store.portfolio.profile = {
        ...store.portfolio.profile,
        ...(payload as Partial<PortfolioData['profile']>),
        updated_at: new Date().toISOString(),
      };
      store.activities.unshift({
        id: Date.now(),
        action: 'Profile Updated',
        details: 'Personal, About, and Contact details saved locally.',
        actor: store.portfolio.profile.full_name,
        created_at: new Date().toISOString(),
      });
      writeStaticStore(store);
      return store.portfolio;
    }
    throw err;
  }
}

export async function uploadProfileImage(payload: {
  filename: string;
  mimeType: string;
  dataBase64: string;
}): Promise<{ profile_image_url: string }> {
  try {
    return await apiFetch<{ profile_image_url: string }>('/api/admin/upload-image', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      store.portfolio.profile.profile_image_url = payload.dataBase64;
      store.activities.unshift({
        id: Date.now(),
        action: 'Profile Photo Replaced',
        details: `Updated profile portrait (${payload.filename}).`,
        actor: store.portfolio.profile.full_name,
        created_at: new Date().toISOString(),
      });
      writeStaticStore(store);
      return { profile_image_url: payload.dataBase64 };
    }
    throw err;
  }
}

export async function uploadCvPdf(payload: {
  filename: string;
  mimeType: string;
  dataBase64: string;
}): Promise<{ ok: boolean; cv_filename: string; has_custom_cv: boolean; cv_updated_at: string }> {
  try {
    return await apiFetch('/api/admin/upload-cv', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      const now = new Date().toISOString();
      store.customCvDataUrl = payload.dataBase64;
      store.portfolio.profile.cv_filename = payload.filename;
      store.portfolio.profile.has_custom_cv = true;
      store.portfolio.profile.cv_updated_at = now;
      writeStaticStore(store);
      return { ok: true, cv_filename: payload.filename, has_custom_cv: true, cv_updated_at: now };
    }
    throw err;
  }
}

export async function resetCvToAuto(): Promise<{
  ok: boolean;
  cv_filename: string;
  has_custom_cv: boolean;
  cv_updated_at: string;
}> {
  try {
    return await apiFetch('/api/admin/reset-cv', { method: 'POST' });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      const now = new Date().toISOString();
      delete store.customCvDataUrl;
      store.portfolio.profile.cv_filename = 'Morshed_Habib_Himel_CV.pdf';
      store.portfolio.profile.has_custom_cv = false;
      store.portfolio.profile.cv_updated_at = now;
      writeStaticStore(store);
      return {
        ok: true,
        cv_filename: 'Morshed_Habib_Himel_CV.pdf',
        has_custom_cv: false,
        cv_updated_at: now,
      };
    }
    throw err;
  }
}

export async function adminMutate<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: Record<string, unknown>
): Promise<T> {
  try {
    return await apiFetch<T>(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      const store = readStaticStore();
      const parts = path.replace('/api/admin/', '').split('/');
      const resource = parts[0];
      const idNum = parts[1] ? Number(parts[1]) : null;
      const b = (body || {}) as Record<string, unknown>;

      if (resource === 'skills') {
        if (method === 'POST') {
          const nextId = Math.max(0, ...store.portfolio.skills.map((x) => x.id)) + 1;
          store.portfolio.skills.push({
            id: nextId,
            name: String(b.name || ''),
            category: String(b.category || ''),
            description: String(b.description || ''),
            icon_key: String(b.icon_key || 'Landmark'),
            focus_label: String(b.focus_label || 'Core Competency'),
            sort_order: Number(b.sort_order ?? 1),
          });
        } else if (method === 'PUT' && idNum) {
          store.portfolio.skills = store.portfolio.skills.map((s) =>
            s.id === idNum ? { ...s, ...(b as object) } : s
          );
        } else if (method === 'DELETE' && idNum) {
          store.portfolio.skills = store.portfolio.skills.filter((s) => s.id !== idNum);
        }
        writeStaticStore(store);
        return { skills: store.portfolio.skills } as T;
      }

      if (resource === 'experiences') {
        if (method === 'POST') {
          const nextId = Math.max(0, ...store.portfolio.experiences.map((x) => x.id)) + 1;
          store.portfolio.experiences.push({
            id: nextId,
            role: String(b.role || ''),
            company: String(b.company || ''),
            period: String(b.period || ''),
            location: String(b.location || ''),
            responsibilities: Array.isArray(b.responsibilities) ? (b.responsibilities as string[]) : [],
            is_current: Boolean(b.is_current),
            sort_order: Number(b.sort_order ?? 1),
          });
        } else if (method === 'PUT' && idNum) {
          store.portfolio.experiences = store.portfolio.experiences.map((e) =>
            e.id === idNum ? { ...e, ...(b as object) } : e
          );
        } else if (method === 'DELETE' && idNum) {
          store.portfolio.experiences = store.portfolio.experiences.filter((e) => e.id !== idNum);
        }
        writeStaticStore(store);
        return { experiences: store.portfolio.experiences } as T;
      }

      if (resource === 'education') {
        if (method === 'POST') {
          const nextId = Math.max(0, ...store.portfolio.education.map((x) => x.id)) + 1;
          store.portfolio.education.push({
            id: nextId,
            degree: String(b.degree || ''),
            institution: String(b.institution || ''),
            university: String(b.university || ''),
            period: String(b.period || ''),
            cgpa: String(b.cgpa || ''),
            sort_order: Number(b.sort_order ?? 1),
          });
        } else if (method === 'PUT' && idNum) {
          store.portfolio.education = store.portfolio.education.map((e) =>
            e.id === idNum ? { ...e, ...(b as object) } : e
          );
        } else if (method === 'DELETE' && idNum) {
          store.portfolio.education = store.portfolio.education.filter((e) => e.id !== idNum);
        }
        writeStaticStore(store);
        return { education: store.portfolio.education } as T;
      }

      if (resource === 'certifications') {
        if (method === 'POST') {
          const nextId = Math.max(0, ...store.portfolio.certifications.map((x) => x.id)) + 1;
          store.portfolio.certifications.push({
            id: nextId,
            title: String(b.title || ''),
            issuer: String(b.issuer || ''),
            period: String(b.period || ''),
            credential_note: String(b.credential_note || ''),
            sort_order: Number(b.sort_order ?? 1),
          });
        } else if (method === 'PUT' && idNum) {
          store.portfolio.certifications = store.portfolio.certifications.map((c) =>
            c.id === idNum ? { ...c, ...(b as object) } : c
          );
        } else if (method === 'DELETE' && idNum) {
          store.portfolio.certifications = store.portfolio.certifications.filter((c) => c.id !== idNum);
        }
        writeStaticStore(store);
        return { certifications: store.portfolio.certifications } as T;
      }

      if (resource === 'socials') {
        if (method === 'POST') {
          const nextId = Math.max(0, ...store.portfolio.socialLinks.map((x) => x.id)) + 1;
          store.portfolio.socialLinks.push({
            id: nextId,
            platform: String(b.platform || ''),
            label: String(b.label || ''),
            url: String(b.url || ''),
            sort_order: Number(b.sort_order ?? 1),
          });
        } else if (method === 'PUT' && idNum) {
          store.portfolio.socialLinks = store.portfolio.socialLinks.map((s) =>
            s.id === idNum ? { ...s, ...(b as object) } : s
          );
        } else if (method === 'DELETE' && idNum) {
          store.portfolio.socialLinks = store.portfolio.socialLinks.filter((s) => s.id !== idNum);
        }
        writeStaticStore(store);
        return { socialLinks: store.portfolio.socialLinks } as T;
      }

      if (resource === 'messages') {
        if (method === 'PATCH' && idNum) {
          store.messages = store.messages.map((m) =>
            m.id === idNum ? { ...m, status: b.status as ContactMessageItem['status'] } : m
          );
        } else if (method === 'DELETE' && idNum) {
          store.messages = store.messages.filter((m) => m.id !== idNum);
        }
        writeStaticStore(store);
        return { messages: store.messages } as T;
      }

      if (resource === 'security') {
        const curHash = await sha256Hex(String(b.currentPassword || ''));
        if (curHash !== store.adminAuthHash) {
          throw new Error('Current password is incorrect.');
        }
        if (typeof b.newPassword === 'string' && b.newPassword.length >= 8) {
          store.adminAuthHash = await sha256Hex(b.newPassword);
        }
        if (typeof b.newUsername === 'string' && b.newUsername.trim()) {
          store.adminUsername = b.newUsername.trim().toLowerCase();
        }
        if (typeof b.newEmail === 'string' && b.newEmail.trim()) {
          store.adminEmail = b.newEmail.trim().toLowerCase();
        }
        writeStaticStore(store);
        return {
          ok: true,
          username: store.adminUsername || 'himel',
          email: store.adminEmail || 'morshedhimel1212@gmail.com',
        } as T;
      }
    }
    throw err;
  }
}

export async function fetchAdminMessages(): Promise<{ messages: ContactMessageItem[] }> {
  try {
    return await apiFetch<{ messages: ContactMessageItem[] }>('/api/admin/messages');
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      return { messages: readStaticStore().messages };
    }
    throw err;
  }
}
