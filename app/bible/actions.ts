'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { createShare } from '@/lib/server/posts';

const shareVerseSchema = z.object({
  userId: z.string().min(1),
  reference: z.string().min(3),
  passageText: z.string().min(8),
  version: z.string().min(2),
  benediction: z.string().optional(),
});

type ShareVerseInput = z.infer<typeof shareVerseSchema>;

export type ShareVerseResult =
  | { status: 'created'; postId: string }
  | { status: 'duplicate'; postId: string };

export async function shareVerseFromBibleAction(input: ShareVerseInput): Promise<ShareVerseResult> {
  const payload = shareVerseSchema.parse(input);

  const existing = await prisma.post.findFirst({
    where: {
      authorId: payload.userId,
      reference: payload.reference,
      passageText: payload.passageText,
      status: PostStatus.PUBLISHED,
    },
    select: { id: true },
  });

  if (existing) {
    return { status: 'duplicate', postId: existing.id };
  }

  const post = await createShare({
    userId: payload.userId,
    reference: payload.reference,
    passageText: payload.passageText,
    testimony: payload.benediction,
    tags: ['scripture', payload.version.toLowerCase()],
  });

  revalidatePath('/feed');

  return { status: 'created', postId: post.id };
}
