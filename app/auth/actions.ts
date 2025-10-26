'use server';

import { z } from 'zod';
import {
  clearSessionCookie,
  consumeMagicLink,
  createMagicLink,
  createSession,
  ensureUserByEmail,
  getSessionIdFromCookies,
  registerUserWithPassword,
  revokeSession,
  setSessionCookie,
  verifyUserCredentials,
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

const passwordRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Please provide a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
});

const passwordSignInSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function requestMagicLinkAction(input: z.infer<typeof emailSchema>) {
  const { email } = emailSchema.parse(input);
  const user = await ensureUserByEmail(email);
  const magicLink = await createMagicLink(user);

  return {
    token: magicLink.token,
    expiresAt: magicLink.expiresAt,
  };
}

export async function completeMagicLinkAction(input: z.infer<typeof tokenSchema>) {
  const { token } = tokenSchema.parse(input);
  const user = await consumeMagicLink(token);
  if (!user) {
    throw new Error('Magic link expired or invalid.');
  }

  const session = await createSession(user.id);
  setSessionCookie(session.id);
  return { user };
}

export async function oauthSignInAction(input: z.infer<typeof providerSchema>) {
  const { provider } = providerSchema.parse(input);
  const user = await ensureUserByEmail(`${provider}@demo.goel.app`);
  const session = await createSession(user.id);
  setSessionCookie(session.id);
  return { user };
}

export async function passwordSignUpAction(input: z.infer<typeof passwordRegistrationSchema>) {
  const { name, email, password } = passwordRegistrationSchema.parse(input);
  const user = await registerUserWithPassword({ name, email, password });
  const session = await createSession(user.id);
  setSessionCookie(session.id);
  return { user };
}

export async function passwordSignInAction(input: z.infer<typeof passwordSignInSchema>) {
  const { email, password } = passwordSignInSchema.parse(input);
  const user = await verifyUserCredentials({ email, password });
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const session = await createSession(user.id);
  setSessionCookie(session.id);
  return { user };
}

export async function signOutAction() {
  const sessionId = getSessionIdFromCookies();
  if (sessionId) {
    await revokeSession(sessionId);
    clearSessionCookie();
  }
  return { signedOut: true };
}
