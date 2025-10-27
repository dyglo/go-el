"use server";

import { prisma } from './prisma';

export type ProfileUser = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  location?: string | null;
  profileSlug?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
};

export async function getUserByProfileHandle(handle: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ profileSlug: handle }, { id: handle }],
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      location: true,
      profileSlug: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.displayName ?? user.email ?? 'Member',
    email: user.email,
    role: user.role,
    location: user.location,
    profileSlug: user.profileSlug,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}
