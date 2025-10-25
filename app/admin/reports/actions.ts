'use server';

import { z } from 'zod';
import { ensureUserByEmail, getCurrentUser } from '@/lib/server/auth';
import { moderateReport, type ModerationActionInput } from '@/lib/server/moderation';

const actionSchema = z.object({
  reportId: z.string().min(1, 'Missing report id.'),
  action: z.enum(['hide', 'warn', 'suspend', 'restore']),
  notes: z.string().max(280).optional(),
});

function resolveModerator() {
  const user = getCurrentUser();
  if (user) {
    return user;
  }
  return ensureUserByEmail('abigail@goel.app');
}

export async function moderateReportAction(input: z.infer<typeof actionSchema>) {
  const moderator = resolveModerator();
  const parsed = actionSchema.parse(input);

  const report = moderateReport({
    reportId: parsed.reportId,
    actorId: moderator.id,
    action: parsed.action as ModerationActionInput['action'],
    notes: parsed.notes?.trim() ? parsed.notes.trim() : undefined,
  });

  return {
    report,
  };
}
