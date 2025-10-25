import { NextResponse } from 'next/server';
import { getGospelPlan, getVerseOfDay } from '@/lib/server/plans';

export async function GET() {
  const [verseOfDay, plan] = await Promise.all([getVerseOfDay(), getGospelPlan()]);

  return NextResponse.json({
    verseOfDay: {
      reference: verseOfDay.reference,
      theme: verseOfDay.theme,
      passageId: verseOfDay.passageId,
      plainText: verseOfDay.passage.plainText,
      translation: verseOfDay.passage.translation,
      isoDate: verseOfDay.isoDate,
      displayDate: verseOfDay.displayDate,
    },
    plan: {
      id: plan.id,
      title: plan.title,
      subtitle: plan.subtitle,
      totalDays: plan.totalDays,
      days: plan.days,
    },
  });
}
