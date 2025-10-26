'use server';

import { ModerationActionType } from '@prisma/client';
import { z } from 'zod';
import { ensureUserByEmail, getCurrentUser } from '@/lib/server/auth';
import { moderateReport, type ModerationActionInput } from '@/lib/server/moderation';

const actionSchema = z.object({
  reportId: z.string().min(1, 'Missing report id.'),
  action: z.enum(['hide', 'warn', 'suspend', 'restore']),
  notes: z.string().max(280).optional(),
});

async function resolveModerator() {
  const user = await getCurrentUser();
  if (user) {
    return user;
  }
  return await ensureUserByEmail('abigail@goel.app');
}

export async function moderateReportAction(input: z.infer<typeof actionSchema>) {
  const moderator = await resolveModerator();
  const parsed = actionSchema.parse(input);
  const actionKey = parsed.action.toUpperCase() as keyof typeof ModerationActionType;
  const action = ModerationActionType[actionKey];

  const report = await moderateReport({
    reportId: parsed.reportId,
    actorId: moderator.id,
    action: action as ModerationActionInput['action'],
    notes: parsed.notes?.trim() ? parsed.notes.trim() : undefined,
  });

  return {
    report,
  };
}
