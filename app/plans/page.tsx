import { getGospelPlan, getVerseOfDay } from '@/lib/server/plans';
import { PlansClient } from './plans-client';

export default async function PlansPage() {
  const [verseOfDay, plan] = await Promise.all([getVerseOfDay(), getGospelPlan()]);

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
    />
  );
}
