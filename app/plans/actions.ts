'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { setPlanDayCompletion } from '@/lib/server/plan-progress';

const schema = z.object({
  planId: z.string().min(1),
  day: z.number().int().min(1),
  complete: z.boolean(),
});

export async function setPlanProgressAction(input: { planId: string; day: number; complete: boolean }) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    throw new Error('Please sign in to update your plan.');
  }

  const parsed = schema.parse(input);
  const result = await setPlanDayCompletion({
    userId: viewer.id,
    planId: parsed.planId,
    day: parsed.day,
    complete: parsed.complete,
  });

  revalidatePath('/plans');
  revalidatePath('/profile');
  if (viewer.profileSlug) {
    revalidatePath(`/u/${viewer.profileSlug}`);
  }

  return result;
}
