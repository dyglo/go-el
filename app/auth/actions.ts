'use server';

import { z } from 'zod';
import {
  clearSessionCookie,
  consumeMagicLink,
  createMagicLink,
  createSession,
  ensureUserByEmail,
  getCurrentUser,
  getSessionIdFromCookies,
  revokeSession,
  setSessionCookie,
} from '@/lib/server/auth';

const emailSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
});

const tokenSchema = z.object({
  token: z.string().min(6, 'Magic link token is required.'),
});

const providerSchema = z.object({
  provider: z.enum(['google', 'apple']),
});

export async function requestMagicLinkAction(input: z.infer<typeof emailSchema>) {
  const { email } = emailSchema.parse(input);
  const user = ensureUserByEmail(email);
  const magicLink = createMagicLink(user);

  return {
    token: magicLink.token,
    expiresAt: magicLink.expiresAt,
  };
}

export async function completeMagicLinkAction(input: z.infer<typeof tokenSchema>) {
  const { token } = tokenSchema.parse(input);
  const user = consumeMagicLink(token);
  if (!user) {
    throw new Error('Magic link expired or invalid.');
  }

  const session = createSession(user.id);
  setSessionCookie(session.id);
  return { user };
}

export async function oauthSignInAction(input: z.infer<typeof providerSchema>) {
  const { provider } = providerSchema.parse(input);
  const user = ensureUserByEmail(`${provider}@demo.goel.app`);
  const session = createSession(user.id);
  setSessionCookie(session.id);
  return { user };
}

export async function signOutAction() {
  const sessionId = getSessionIdFromCookies();
  if (sessionId) {
    revokeSession(sessionId);
    clearSessionCookie();
  }
  return { signedOut: true };
}