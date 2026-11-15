import type {
  AdminOverviewData,
  AdminUser,
  ContactMessageItem,
  PortfolioData,
} from '@/src/types/portfolio';

let memoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

export function getAuthToken(): string | null {
  return memoryToken;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (memoryToken) {
    headers.set('Authorization', `Bearer ${memoryToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchPortfolio(): Promise<PortfolioData> {
  return apiFetch<PortfolioData>('/api/portfolio');
}

export async function trackVisit(visitorId: string): Promise<{ totalVisitors: number }> {
  return apiFetch<{ totalVisitors: number }>('/api/analytics/visit', {
    method: 'POST',
    body: JSON.stringify({ visitorId }),
  });
}

export async function submitContactMessage(payload: {
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; id: number }> {
  return apiFetch<{ ok: boolean; id: number }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function checkAuthSession(): Promise<{ authenticated: boolean; user: AdminUser | null }> {
  return apiFetch<{ authenticated: boolean; user: AdminUser | null }>('/api/auth/me');
}

export async function loginAdmin(identifier: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const res = await apiFetch<{ token: string; user: AdminUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  setAuthToken(res.token);
  return res;
}

export async function logoutAdmin(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  setAuthToken(null);
}

export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  return apiFetch<AdminOverviewData>('/api/admin/overview');
}

export async function updateAdminProfile(payload: Record<string, unknown>): Promise<PortfolioData> {
  return apiFetch<PortfolioData>('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadProfileImage(payload: {
  filename: string;
  mimeType: string;
  dataBase64: string;
}): Promise<{ profile_image_url: string }> {
  return apiFetch<{ profile_image_url: string }>('/api/admin/upload-image', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadCvPdf(payload: {
  filename: string;
  mimeType: string;
  dataBase64: string;
}): Promise<{ ok: boolean; cv_filename: string; has_custom_cv: boolean; cv_updated_at: string }> {
  return apiFetch('/api/admin/upload-cv', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetCvToAuto(): Promise<{
  ok: boolean;
  cv_filename: string;
  has_custom_cv: boolean;
  cv_updated_at: string;
}> {
  return apiFetch('/api/admin/reset-cv', { method: 'POST' });
}

export async function adminMutate<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: Record<string, unknown>
): Promise<T> {
  return apiFetch<T>(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function fetchAdminMessages(): Promise<{ messages: ContactMessageItem[] }> {
  return apiFetch<{ messages: ContactMessageItem[] }>('/api/admin/messages');
}
