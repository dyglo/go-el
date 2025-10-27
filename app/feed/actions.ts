'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { reportPost, toggleReaction } from '@/lib/server/posts';
import { toggleReflection } from '@/lib/server/reflections';
import { getCurrentUser } from '@/lib/server/auth';
import type { ReactionType } from '@/lib/server/posts';

const toggleSchema = z.object({
  postId: z.string().min(1),
  reaction: z.enum(['amen', 'praying']),
  viewerId: z.string().min(1, 'Missing viewer'),
});

const reportSchema = z.object({
  postId: z.string().min(1),
  reporterId: z.string().min(1),
  reason: z.string().min(3),
});

const reflectionSchema = z.object({
  postId: z.string().min(1),
});

export async function toggleReactionAction(input: {
  postId: string;
  reaction: ReactionType;
  viewerId: string;
}) {
  const parsed = toggleSchema.parse(input);
  const result = await toggleReaction(parsed.postId, parsed.reaction, parsed.viewerId);
  return result;
}

export async function reportPostAction(input: {
  postId: string;
  reporterId: string;
  reason: string;
}) {
  const parsed = reportSchema.parse(input);
  const result = await reportPost(parsed);
  revalidatePath('/feed');
  return result;
}

export async function toggleReflectionAction(input: { postId: string }) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    throw new Error('Sign in to save reflections.');
  }
  const parsed = reflectionSchema.parse(input);
  const result = await toggleReflection(parsed.postId, viewer.id);
  revalidatePath('/feed');
  revalidatePath('/profile');
  if (viewer.profileSlug) {
    revalidatePath(`/u/${viewer.profileSlug}`);
  }
  return result;
}
