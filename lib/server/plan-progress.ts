"use server";

import { prisma } from './prisma';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type ToggleInput = {
  userId: string;
  planId: string;
  day: number;
  complete: boolean;
};

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function diffDays(aKey: string, bKey: string): number {
  const [aYear, aMonth, aDay] = aKey.split('-').map((value) => Number.parseInt(value, 10));
  const [bYear, bMonth, bDay] = bKey.split('-').map((value) => Number.parseInt(value, 10));
  const aEpoch = Date.UTC(aYear, (aMonth ?? 1) - 1, aDay ?? 1);
  const bEpoch = Date.UTC(bYear, (bMonth ?? 1) - 1, bDay ?? 1);
  return Math.round((aEpoch - bEpoch) / MS_PER_DAY);
}

function computeStreaks(dateKeys: string[]) {
  if (dateKeys.length === 0) {
    return { current: 0, longest: 0 };
  }

  const unique = Array.from(new Set(dateKeys));
  unique.sort();

  let longest = 1;
  let chain = 1;
  for (let index = 1; index < unique.length; index += 1) {
    const gap = diffDays(unique[index], unique[index - 1]);
    if (gap === 1) {
      chain += 1;
      longest = Math.max(longest, chain);
    } else if (gap > 1) {
      chain = 1;
    }
  }

  const todayKey = toDateKey(new Date());
  const lastKey = unique[unique.length - 1];
  const gapToToday = diffDays(todayKey, lastKey);
  if (gapToToday > 1) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const gap = diffDays(unique[index], unique[index - 1]);
    if (gap === 1) {
      current += 1;
    } else if (gap > 1) {
      break;
    }
  }

  return { current, longest };
}

export async function setPlanDayCompletion({ userId, planId, day, complete }: ToggleInput) {
  if (day < 1 || day > 366) {
    throw new Error('Invalid plan day provided.');
  }
  if (!planId || typeof planId !== 'string') {
    throw new Error('Invalid plan identifier.');
  }

  if (!complete) {
    await prisma.planProgress
      .delete({
        where: {
          userId_planId_day: {
            userId,
            planId,
            day,
          },
        },
      })
      .catch(() => {});
    return { isCompleted: false as const };
  }

  const now = new Date();
  await prisma.planProgress.upsert({
    where: {
      userId_planId_day: {
        userId,
        planId,
        day,
      },
    },
    update: {
      completedAt: now,
    },
    create: {
      userId,
      planId,
      day,
      completedAt: now,
    },
  });

  return { isCompleted: true as const, completedAt: now.toISOString() };
}

export async function getPlanProgressEntries(userId: string, planId: string) {
  return prisma.planProgress.findMany({
    where: { userId, planId },
    orderBy: [{ day: 'asc' }],
  });
}

export type PlanProgressSummary = {
  planId: string;
  completedDays: number[];
  totalCompleted: number;
  completionPercent: number;
  currentStreak: number;
  longestStreak: number;
  remainingDays: number;
  lastCompletedAt?: string;
};

export async function summarisePlanProgress(userId: string, planId: string, totalDays: number): Promise<PlanProgressSummary> {
  const entries = await getPlanProgressEntries(userId, planId);
  const completedDays = entries.map((entry) => entry.day);
  const totalCompleted = completedDays.length;
  const completionPercent = totalDays > 0 ? Math.min(100, (totalCompleted / totalDays) * 100) : 0;
  const remainingDays = Math.max(0, totalDays - totalCompleted);

  const dateKeys = entries.map((entry) => toDateKey(entry.completedAt));
  const streaks = computeStreaks(dateKeys);
  const lastCompletedAt = entries.length ? entries[entries.length - 1]?.completedAt.toISOString() : undefined;

  return {
    planId,
    completedDays,
    totalCompleted,
    completionPercent,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    remainingDays,
    lastCompletedAt,
  };
}


