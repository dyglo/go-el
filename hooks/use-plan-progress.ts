/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type StoredProgress = {
  completed: Record<number, string>;
};

const STORAGE_KEY = 'goel:gospel-plan:progress';
const MAX_PLAN_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function initialState(): StoredProgress {
  if (typeof window === 'undefined') {
    return { completed: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completed: {} };
    }
    const parsed = JSON.parse(raw) as StoredProgress;
    if (!parsed || typeof parsed !== 'object' || !parsed.completed) {
      return { completed: {} };
    }
    return { completed: parsed.completed };
  } catch {
    return { completed: {} };
  }
}

function saveState(state: StoredProgress) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (e.g., storage quota or private mode)
  }
}

function toDateKey(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function keyToEpoch(key: string): number {
  const [year, month, day] = key.split('-').map((segment) => Number.parseInt(segment, 10));
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

function diffDays(aKey: string, bKey: string) {
  return Math.round((keyToEpoch(aKey) - keyToEpoch(bKey)) / MS_PER_DAY);
}

function computeStreaks(completedDateKeys: string[]) {
  if (!completedDateKeys.length) {
    return { current: 0, longest: 0 };
  }

  const uniqueKeys = Array.from(new Set(completedDateKeys));
  uniqueKeys.sort();

  let longest = 1;
  let chain = 1;

  for (let index = 1; index < uniqueKeys.length; index += 1) {
    const gap = diffDays(uniqueKeys[index], uniqueKeys[index - 1]);
    if (gap === 0) {
      continue;
    }
    if (gap === 1) {
      chain += 1;
      longest = Math.max(longest, chain);
    } else {
      chain = 1;
    }
  }

  const todayKey = toDateKey(new Date().toISOString());
  const lastKey = uniqueKeys[uniqueKeys.length - 1];
  const gapToToday = diffDays(todayKey, lastKey);

  if (gapToToday > 1) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let index = uniqueKeys.length - 1; index > 0; index -= 1) {
    const gap = diffDays(uniqueKeys[index], uniqueKeys[index - 1]);
    if (gap === 0) {
      continue;
    }
    if (gap === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

export function usePlanProgress(totalDays: number = MAX_PLAN_DAYS) {
  const [state, setState] = useState<StoredProgress>(() => initialState());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setState(initialState());
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const completedDays = useMemo(() => Object.keys(state.completed).map((day) => Number.parseInt(day, 10)), [state]);
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);
  const completedCount = completedSet.size;
  const completionPercent = totalDays > 0 ? Math.min(100, (completedCount / totalDays) * 100) : 0;
  const completedDateKeys = useMemo(() => Object.values(state.completed).map((iso) => toDateKey(iso)), [state]);
  const streaks = useMemo(() => computeStreaks(completedDateKeys), [completedDateKeys]);

  const toggleDay = useCallback(
    (day: number) => {
      if (day < 1 || day > totalDays) {
        return;
      }

      setState((previous) => {
        const next: StoredProgress = {
          completed: { ...previous.completed },
        };

        if (next.completed[day]) {
          delete next.completed[day];
        } else {
          next.completed[day] = new Date().toISOString();
        }

        return next;
      });
    },
    [totalDays]
  );

  return {
    completedDays: completedSet,
    completedCount,
    completionPercent,
    streaks,
    toggleDay,
  };
}
