'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createShare, searchScripture } from '@/lib/server/posts';
import { parseReference, getWebPassageByReference } from '@/lib/scripture';

const searchSchema = z.string().min(2, 'Please enter at least two characters.');

const shareSchema = z.object({
  userId: z.string().min(1, 'Missing user'),
  reference: z.string().min(3, 'Select a scripture reference.'),
  reflection: z.string().max(160).optional(),
  includeReflection: z.boolean().optional(),
});

const previewSchema = z.string().min(3);

export async function searchScriptureAction(query: string) {
  const parsed = searchSchema.safeParse(query.trim());
  if (!parsed.success) {
    return [];
  }

  return searchScripture(parsed.data, 12);
}

export async function getPassagePreviewAction(reference: string) {
  const parsed = previewSchema.parse(reference);
  return getWebPassageByReference(parsed);
}

export async function createShareAction(input: z.infer<typeof shareSchema>) {
  const parsed = shareSchema.parse(input);
  const reference = parseReference(parsed.reference);

  const post = await createShare({
    userId: parsed.userId,
    reference,
    reflection: parsed.includeReflection ? parsed.reflection : undefined,
  });

  revalidatePath('/feed');
  return post;
}
