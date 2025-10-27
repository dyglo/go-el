import { GOSPEL_PLAN_DAYS, VERSE_OF_DAY_ROTATION, type GospelPlanDay } from '@/lib/plans/data';
import { getWebPassageByReference, parseReference, referenceToPassageId } from '@/lib/scripture';
import type { Passage } from '@/lib/scripture';

export const GOSPEL_PLAN_ID = 'gospel-journey-30';
export const KNOWN_PLAN_IDS = [GOSPEL_PLAN_ID];

export type VerseOfDay = {
  reference: string;
  theme: string;
  passage: Passage;
  passageId: string;
  isoDate: string;
  displayDate: string;
};

export type GospelPlanSummary = {
  id: string;
  title: string;
  subtitle: string;
  days: (GospelPlanDay & {
    available: boolean;
    passageId?: string;
    excerpt?: string;
    passage?: Passage;
  })[];
  totalDays: number;
};

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function getVerseOfDay(referenceDate = new Date()): Promise<VerseOfDay> {
  const dayOfYear = getDayOfYear(referenceDate);
  const rotationLength = VERSE_OF_DAY_ROTATION.length;

  let resolvedPassage: Passage | null = null;
  let resolvedSeed = VERSE_OF_DAY_ROTATION[dayOfYear % rotationLength];

  for (let offset = 0; offset < rotationLength; offset += 1) {
    const candidate = VERSE_OF_DAY_ROTATION[(dayOfYear + offset) % rotationLength];
    // eslint-disable-next-line no-await-in-loop
    const passage = await getWebPassageByReference(candidate.reference);
    if (passage) {
      resolvedPassage = passage;
      resolvedSeed = candidate;
      break;
    }
  }

  if (!resolvedPassage) {
    const fallbackReference = 'John 3:16';
    const fallbackPassage = await getWebPassageByReference(fallbackReference);
    if (!fallbackPassage) {
      throw new Error('Unable to load any Verse of the Day passage.');
    }
    resolvedPassage = fallbackPassage;
    resolvedSeed = {
      reference: fallbackReference,
      theme: 'God So Loved',
    };
  }

  const passageId = referenceToPassageId(resolvedPassage.reference);
  const displayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(referenceDate);

  return {
    reference: resolvedSeed.reference,
    theme: resolvedSeed.theme,
    passage: resolvedPassage,
    passageId,
    isoDate: referenceDate.toISOString(),
    displayDate,
  };
}

export async function getGospelPlan(): Promise<GospelPlanSummary> {
  const daysWithAvailability = await Promise.all(
    GOSPEL_PLAN_DAYS.map(async (day) => {
      const passage = await getWebPassageByReference(day.reference).catch(() => null);
      if (!passage) {
        return {
          ...day,
          available: false,
        };
      }
      const excerpt =
        passage.plainText.length > 220 ? `${passage.plainText.slice(0, 220).trimEnd()}…` : passage.plainText;
      return {
        ...day,
        available: true,
        passageId: referenceToPassageId(passage.reference),
        excerpt,
        passage,
      };
    })
  );

  return {
    id: GOSPEL_PLAN_ID,
    title: '30-Day Gospel Journey',
    subtitle: 'Walk through the life and teachings of Jesus.',
    days: daysWithAvailability,
    totalDays: GOSPEL_PLAN_DAYS.length,
  };
}

export function getPlanDayByReference(reference: string): GospelPlanDay | undefined {
  const parsed = parseReference(reference);
  return GOSPEL_PLAN_DAYS.find((day) => {
    const candidate = parseReference(day.reference);
    return (
      candidate.book === parsed.book &&
      candidate.chapter === parsed.chapter &&
      candidate.startVerse === parsed.startVerse &&
      candidate.endVerse === parsed.endVerse
    );
  });
}

export function getPlanOverview(planId: string) {
  if (planId === GOSPEL_PLAN_ID) {
    return {
      id: GOSPEL_PLAN_ID,
      title: '30-Day Gospel Journey',
      subtitle: 'Walk through the life and teachings of Jesus.',
      totalDays: GOSPEL_PLAN_DAYS.length,
    };
  }
  return null;
}
