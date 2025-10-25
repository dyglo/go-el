import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import {
  getDatabase,
  type MagicLinkRecord,
  type OAuthStateRecord,
  type SessionRecord,
  type UserRecord,
} from './db';
import { ensureSeedData } from './seed';

const SESSION_COOKIE = 'goel_session';
const MAGIC_LINK_TTL_MINUTES = 30;
const SESSION_TTL_HOURS = 24;

function now() {
  return new Date();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export function ensureUserByEmail(email: string): UserRecord {
  ensureSeedData();
  const db = getDatabase();
  const normalised = normaliseEmail(email);
  const existing = Array.from(db.users.values()).find((user) => user.email?.toLowerCase() === normalised);

  if (existing) {
    return existing;
  }

  const id = `user_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const user: UserRecord = {
    id,
    name: normalised.split('@')[0],
    email: normalised,
    role: 'Member',
    createdAt: now().toISOString(),
  };
  db.users.set(id, user);
  return user;
}

export function createMagicLink(user: UserRecord): MagicLinkRecord {
  const db = getDatabase();
  const issuedAt = now();
  const token = randomUUID().replace(/-/g, '');
  const record: MagicLinkRecord = {
    id: `magic_${token.slice(0, 10)}`,
    userId: user.id,
    email: user.email ?? '',
    token,
    createdAt: issuedAt.toISOString(),
    expiresAt: addMinutes(issuedAt, MAGIC_LINK_TTL_MINUTES).toISOString(),
  };
  db.magicLinks.set(record.token, record);
  return record;
}

export function consumeMagicLink(token: string): UserRecord | null {
  const db = getDatabase();
  const record = db.magicLinks.get(token);
  if (!record) {
    return null;
  }

  if (record.consumedAt) {
    return db.users.get(record.userId) ?? null;
  }

  const expiresAt = new Date(record.expiresAt);
  if (expiresAt.getTime() < now().getTime()) {
    db.magicLinks.delete(token);
    return null;
  }

  record.consumedAt = now().toISOString();
  db.magicLinks.set(token, record);
  return db.users.get(record.userId) ?? null;
}

export function createSession(userId: string): SessionRecord {
  const db = getDatabase();
  const issuedAt = now();
  const session: SessionRecord = {
    id: `session_${randomUUID().replace(/-/g, '').slice(0, 18)}`,
    userId,
    createdAt: issuedAt.toISOString(),
    expiresAt: addHours(issuedAt, SESSION_TTL_HOURS).toISOString(),
  };
  db.sessions.set(session.id, session);
  return session;
}

export function revokeSession(sessionId: string) {
  const db = getDatabase();
  db.sessions.delete(sessionId);
}

export function getSession(sessionId: string): SessionRecord | null {
  const db = getDatabase();
  const session = db.sessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() < now().getTime()) {
    db.sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function beginOAuth(provider: 'google' | 'apple', redirectTo?: string): OAuthStateRecord {
  const db = getDatabase();
  const issuedAt = now();
  const state: OAuthStateRecord = {
    id: `oauth_${randomUUID().replace(/-/g, '').slice(0, 18)}`,
    provider,
    redirectTo,
    createdAt: issuedAt.toISOString(),
    expiresAt: addMinutes(issuedAt, 10).toISOString(),
  };
  db.oauthStates.set(state.id, state);
  return state;
}

export function completeOAuth(stateId: string): UserRecord | null {
  const db = getDatabase();
  const state = db.oauthStates.get(stateId);
  if (!state) {
    return null;
  }

  if (new Date(state.expiresAt).getTime() < now().getTime()) {
    db.oauthStates.delete(stateId);
    return null;
  }

  const demoEmail = `${state.provider}@demo.goel.app`;
  const user = ensureUserByEmail(demoEmail);
  db.oauthStates.delete(stateId);
  return user;
}

export function setSessionCookie(sessionId: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionIdFromCookies(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export function getCurrentUser(): UserRecord | null {
  ensureSeedData();
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  const session = getSession(sessionId);
  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const db = getDatabase();
  const user = db.users.get(session.userId) ?? null;
  if (!user) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return user;
}