'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createShare } from '@/lib/server/posts';

const shareSchema = z.object({
  userId: z.string().min(1, 'Missing user'),
  reference: z.string().min(3, 'Please add a Scripture reference.'),
  passageText: z
    .string()
    .min(12, 'Include the verse text you wish to share.')
    .max(1200, 'Passage text should remain under 1,200 characters.'),
  testimony: z
    .string()
    .max(600, 'Your testimony can be at most 600 characters.')
    .optional(),
  tags: z.array(z.string()).optional(),
});

export async function createShareAction(input: z.infer<typeof shareSchema>) {
  const parsed = shareSchema.parse(input);
  const post = await createShare(parsed);
  revalidatePath('/feed');
  return post;
}
