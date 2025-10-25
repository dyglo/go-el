'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { reportPost, toggleReaction } from '@/lib/server/posts';
import type { ReactionType } from '@/lib/server/db';

const toggleSchema = z.object({
  postId: z.string().min(1),
  reaction: z.enum(['amen', 'praying']),
  viewerId: z.string().optional(),
});

const reportSchema = z.object({
  postId: z.string().min(1),
  reporterId: z.string().min(1),
  reason: z.string().min(3),
});

export async function toggleReactionAction(input: {
  postId: string;
  reaction: ReactionType;
  viewerId?: string;
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
