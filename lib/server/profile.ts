import { prisma } from './prisma';

const SLUG_MAX_LENGTH = 48;

function normaliseCandidate(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH);
  return cleaned || 'member';
}

async function slugExists(candidate: string, excludeUserId?: string): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: {
      profileSlug: candidate,
      NOT: excludeUserId ? { id: excludeUserId } : undefined,
    },
    select: { id: true },
  });
  return Boolean(existing);
}

function deriveInitialCandidate(options: { name?: string | null; email?: string | null; fallback: string }): string {
  if (options.name?.trim()) {
    return normaliseCandidate(options.name);
  }
  if (options.email?.trim()) {
    const [localPart] = options.email.split('@');
    if (localPart) {
      return normaliseCandidate(localPart);
    }
  }
  return normaliseCandidate(options.fallback);
}

export async function ensureProfileSlugForUser(userId: string, options?: { name?: string | null; email?: string | null }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileSlug: true, displayName: true, email: true },
  });
  if (!user) {
    throw new Error('User not found while ensuring profile slug.');
  }

  if (user.profileSlug) {
    const stillUnique = await slugExists(user.profileSlug, userId);
    if (!stillUnique) {
      return user.profileSlug;
    }
  }

  const candidate = deriveInitialCandidate({
    name: options?.name ?? user.displayName ?? null,
    email: options?.email ?? user.email ?? null,
    fallback: userId.slice(0, 8),
  });

  if (!(await slugExists(candidate, userId))) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profileSlug: candidate },
      select: { profileSlug: true },
    });
    return updated.profileSlug ?? candidate;
  }

  let suffix = 2;
  while (suffix < 50) {
    const nextCandidate = `${candidate}-${suffix}`.slice(0, SLUG_MAX_LENGTH);
    // eslint-disable-next-line no-await-in-loop
    const exists = await slugExists(nextCandidate, userId);
    if (!exists) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { profileSlug: nextCandidate },
        select: { profileSlug: true },
      });
      return updated.profileSlug ?? nextCandidate;
    }
    suffix += 1;
  }

  const fallbackSlug = `${candidate}-${Date.now().toString(36)}`.slice(0, SLUG_MAX_LENGTH);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { profileSlug: fallbackSlug },
    select: { profileSlug: true },
  });
  return updated.profileSlug ?? fallbackSlug;
}
