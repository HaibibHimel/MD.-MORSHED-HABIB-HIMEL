import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const secretFile = path.resolve(process.cwd(), 'data', '.session-secret');

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

const SESSION_SECRET = getSessionSecret();
export const SESSION_COOKIE_NAME = 'mh_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function signToken(sessionId: string): string {
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, sig] = parts;
  if (!sessionId || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return sessionId;
}

export function createSession(userId: number, role: string): { token: string; expiresAt: number } {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare(
    'INSERT INTO sessions (id, user_id, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, userId, role, expiresAt, new Date().toISOString());
  return { token: signToken(sessionId), expiresAt };
}

export function destroySession(rawToken: string | undefined): void {
  if (!rawToken) return;
  const sessionId = verifySignedToken(rawToken);
  if (!sessionId) return;
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export function extractTokenFromRequest(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  return parseCookie(req.headers.cookie, SESSION_COOKIE_NAME);
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

export function getAuthenticatedAdmin(req: Request): AdminUser | null {
  const rawToken = extractTokenFromRequest(req);
  if (!rawToken) return null;
  const sessionId = verifySignedToken(rawToken);
  if (!sessionId) return null;

  const row = db.prepare(`
    SELECT s.expires_at, u.id, u.username, u.email, u.role, u.full_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `).get(sessionId) as
    | { expires_at: number; id: number; username: string | null; email: string; role: string; full_name: string }
    | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  if (row.role !== 'admin') return null;

  return {
    id: row.id,
    username: row.username || row.email,
    email: row.email,
    role: row.role,
    full_name: row.full_name,
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const admin = getAuthenticatedAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Authentication required. Please sign in as administrator.' });
    return;
  }
  req.adminUser = admin;
  next();
}
