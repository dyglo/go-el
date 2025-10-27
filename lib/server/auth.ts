import { randomUUID } from 'crypto';
import { AuthProvider as PrismaAuthProvider } from '@prisma/client';
import type {
  MagicLink as PrismaMagicLink,
  OAuthState as PrismaOAuthState,
  Session as PrismaSession,
  User as PrismaUser,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import {
  getDatabase,
  type MagicLinkRecord,
  type OAuthStateRecord,
  type SessionRecord,
  type UserRecord,
} from './db';
import { ensureSeedData } from './seed';
import { ensureProfileSlugForUser } from './profile';

const SESSION_COOKIE = 'goel_session';
const MAGIC_LINK_TTL_MINUTES = 30;
const SESSION_TTL_HOURS = 24;
const BCRYPT_ROUNDS = 10;

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

function fallbackNameFromEmail(email?: string | null) {
  if (!email) {
    return 'Friend';
  }
  const [localPart] = email.split('@');
  return localPart?.length ? localPart : 'Friend';
}

function toUserRecord(user: PrismaUser): UserRecord {
  return {
    id: user.id,
    name: user.displayName ?? fallbackNameFromEmail(user.email),
    email: user.email ?? undefined,
    role: user.role,
    location: user.location ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    profileSlug: user.profileSlug ?? undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

function syncUserToMemory(user: PrismaUser): UserRecord {
  const record = toUserRecord(user);
  const db = getDatabase();
  db.users.set(record.id, record);
  return record;
}

function findSeedUserByEmail(email: string): UserRecord | null {
  const db = getDatabase();
  for (const user of Array.from(db.users.values())) {
    if (user.email && user.email.toLowerCase() === email) {
      return user;
    }
  }
  return null;
}

async function loadUser(userId: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }
  return syncUserToMemory(user);
}

function toMagicLinkRecord(record: PrismaMagicLink): MagicLinkRecord {
  return {
    id: record.id,
    userId: record.userId,
    email: record.email,
    token: record.token,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    consumedAt: record.consumedAt?.toISOString(),
  };
}

function toSessionRecord(session: PrismaSession): SessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

const prismaProviderToLiteral: Record<PrismaAuthProvider, 'google' | 'apple'> = {
  [PrismaAuthProvider.GOOGLE]: 'google',
  [PrismaAuthProvider.APPLE]: 'apple',
};

const literalProviderToPrisma: Record<'google' | 'apple', PrismaAuthProvider> = {
  google: PrismaAuthProvider.GOOGLE,
  apple: PrismaAuthProvider.APPLE,
};

function toOAuthStateRecord(state: PrismaOAuthState): OAuthStateRecord {
  return {
    id: state.id,
    provider: prismaProviderToLiteral[state.provider],
    redirectTo: state.redirectTo ?? undefined,
    createdAt: state.createdAt.toISOString(),
    expiresAt: state.expiresAt.toISOString(),
  };
}

export async function ensureUserByEmail(email: string): Promise<UserRecord> {
  ensureSeedData();
  const normalised = normaliseEmail(email);

  const existing = await prisma.user.findUnique({ where: { email: normalised } });
  if (existing) {
    await ensureProfileSlugForUser(existing.id, { name: existing.displayName, email: existing.email });
    const refreshed = await prisma.user.findUnique({ where: { id: existing.id } });
    return syncUserToMemory(refreshed ?? existing);
  }

  const seed = findSeedUserByEmail(normalised);
  if (seed) {
    const createdFromSeed = await prisma.user.create({
      data: {
        id: seed.id,
        email: normalised,
        displayName: seed.name,
        role: seed.role,
        location: seed.location,
        avatarUrl: seed.avatarUrl,
        createdAt: new Date(seed.createdAt),
      },
    });
    await ensureProfileSlugForUser(createdFromSeed.id, { name: createdFromSeed.displayName, email: createdFromSeed.email });
    const hydrated = await prisma.user.findUnique({ where: { id: createdFromSeed.id } });
    return syncUserToMemory(hydrated ?? createdFromSeed);
  }

  const created = await prisma.user.create({
    data: {
      email: normalised,
      displayName: fallbackNameFromEmail(normalised),
      role: 'Member',
    },
  });

  await ensureProfileSlugForUser(created.id, { name: created.displayName, email: created.email });
  const hydratedCreated = await prisma.user.findUnique({ where: { id: created.id } });
  return syncUserToMemory(hydratedCreated ?? created);
}

export async function createMagicLink(user: UserRecord): Promise<MagicLinkRecord> {
  ensureSeedData();
  if (!user.email) {
    throw new Error('Magic links require an email address.');
  }

  await ensureUserByEmail(user.email);

  const issuedAt = now();
  const token = randomUUID().replace(/-/g, '');
  const expiresAt = addMinutes(issuedAt, MAGIC_LINK_TTL_MINUTES);

  const record = await prisma.magicLink.create({
    data: {
      token,
      email: user.email,
      userId: user.id,
      createdAt: issuedAt,
      expiresAt,
    },
  });

  return toMagicLinkRecord(record);
}

export async function consumeMagicLink(token: string): Promise<UserRecord | null> {
  ensureSeedData();
  const record = await prisma.magicLink.findUnique({ where: { token } });
  if (!record) {
    return null;
  }

  if (record.consumedAt) {
    return loadUser(record.userId);
  }

  if (record.expiresAt.getTime() < now().getTime()) {
    await prisma.magicLink.delete({ where: { token } });
    return null;
  }

  await prisma.magicLink.update({
    where: { token },
    data: { consumedAt: now() },
  });

  return loadUser(record.userId);
}

export async function createSession(userId: string): Promise<SessionRecord> {
  const issuedAt = now();
  const expiresAt = addHours(issuedAt, SESSION_TTL_HOURS);
  const session = await prisma.session.create({
    data: {
      userId,
      createdAt: issuedAt,
      expiresAt,
    },
  });
  return toSessionRecord(session);
}

export async function revokeSession(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch (error) {
    // Ignore missing sessions.
    if (process.env.NODE_ENV === 'development') {
      console.warn('Attempted to revoke missing session', sessionId, error);
    }
  }
}

export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < now().getTime()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }

  return toSessionRecord(session);
}

export async function beginOAuth(provider: 'google' | 'apple', redirectTo?: string): Promise<OAuthStateRecord> {
  const issuedAt = now();
  const state = await prisma.oAuthState.create({
    data: {
      provider: literalProviderToPrisma[provider],
      redirectTo,
      createdAt: issuedAt,
      expiresAt: addMinutes(issuedAt, 10),
    },
  });
  return toOAuthStateRecord(state);
}

export async function completeOAuth(stateId: string): Promise<UserRecord | null> {
  const state = await prisma.oAuthState.findUnique({ where: { id: stateId } });
  if (!state) {
    return null;
  }

  if (state.expiresAt.getTime() < now().getTime()) {
    await prisma.oAuthState.delete({ where: { id: stateId } });
    return null;
  }

  const provider = prismaProviderToLiteral[state.provider];
  const demoEmail = `${provider}@demo.goel.app`;
  const user = await ensureUserByEmail(demoEmail);
  await prisma.oAuthState.delete({ where: { id: stateId } });
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

export async function getCurrentUser(): Promise<UserRecord | null> {
  ensureSeedData();
  const sessionId = getSessionIdFromCookies();
  if (!sessionId) {
    return null;
  }

  const session = await getSession(sessionId);
  if (!session) {
    clearSessionCookie();
    return null;
  }

  const user = await loadUser(session.userId);
  if (!user) {
    await revokeSession(session.id);
    clearSessionCookie();
    return null;
  }

  return user;
}

export async function registerUserWithPassword(input: {
  name: string;
  email: string;
  password: string;
}): Promise<UserRecord> {
  ensureSeedData();
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  const password = input.password;

  if (!name) {
    throw new Error('Name is required.');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  if (existing) {
    if (existing.passwordHash) {
      throw new Error('An account already exists for this email.');
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        displayName: name,
        passwordHash,
        email,
      },
    });
    await ensureProfileSlugForUser(updated.id, { name: updated.displayName, email: updated.email });
    const hydrated = await prisma.user.findUnique({ where: { id: updated.id } });
    return syncUserToMemory(hydrated ?? updated);
  }

  const created = await prisma.user.create({
    data: {
      email,
      displayName: name,
      passwordHash,
      role: 'Member',
    },
  });

  await ensureProfileSlugForUser(created.id, { name: created.displayName, email: created.email });
  const hydratedCreated = await prisma.user.findUnique({ where: { id: created.id } });
  return syncUserToMemory(hydratedCreated ?? created);
}

export async function verifyUserCredentials(input: {
  email: string;
  password: string;
}): Promise<UserRecord | null> {
  ensureSeedData();
  const email = normaliseEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return syncUserToMemory(user);
}

export async function updateUserPassword(userId: string, password: string): Promise<void> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
