import { getCurrentUser } from '@/lib/server/auth';
import { getPlanProgressEntries } from '@/lib/server/plan-progress';
import { getGospelPlan, getVerseOfDay } from '@/lib/server/plans';
import { PlansClient } from './plans-client';

export default async function PlansPage() {
  const viewer = await getCurrentUser();
  const [verseOfDay, plan] = await Promise.all([getVerseOfDay(), getGospelPlan()]);
  let initialProgress: Record<number, string> | undefined;

  if (viewer) {
    const entries = await getPlanProgressEntries(viewer.id, plan.id);
    const progressByDay: Record<number, string> = {};
    for (const entry of entries) {
      progressByDay[entry.day] = entry.completedAt.toISOString();
    }
    initialProgress = progressByDay;
  }

  return (
    <PlansClient
      verseOfDay={{
        reference: verseOfDay.reference,
        theme: verseOfDay.theme,
        displayDate: verseOfDay.displayDate,
        passageId: verseOfDay.passageId,
        passage: verseOfDay.passage,
      }}
      plan={{
        id: plan.id,
        title: plan.title,
        subtitle: plan.subtitle,
        totalDays: plan.totalDays,
        days: plan.days,
      }}
      viewerId={viewer?.id ?? null}
      initialProgress={initialProgress}
    />
  );
}
