/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type StoredProgress = {
  completed: Record<number, string>;
};

type UsePlanProgressOptions = {
  totalDays?: number;
  initialCompleted?: Record<number, string>;
};

const STORAGE_KEY = 'goel:gospel-plan:progress';
const MAX_PLAN_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function readLocalState(): StoredProgress {
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

function initialState(seed?: StoredProgress): StoredProgress {
  if (typeof window === 'undefined') {
    return seed ?? { completed: {} };
  }

  const local = readLocalState();
  if (!seed) {
    return local;
  }

  return {
    completed: { ...local.completed, ...seed.completed },
  };
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

export function usePlanProgress(options: UsePlanProgressOptions = {}) {
  const { totalDays = MAX_PLAN_DAYS, initialCompleted } = options;

  const initialCompletedSignature = useMemo(
    () => (initialCompleted ? JSON.stringify(initialCompleted) : null),
    [initialCompleted]
  );

  const seedState = useMemo<StoredProgress | undefined>(() => {
    if (!initialCompleted) {
      return undefined;
    }
    return {
      completed: { ...initialCompleted },
    };
  }, [initialCompletedSignature]);

  const [state, setState] = useState<StoredProgress>(() => initialState(seedState));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setState(initialState(seedState));
  }, [initialCompletedSignature, seedState]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const completedDaysArray = useMemo(
    () => Object.keys(state.completed).map((day) => Number.parseInt(day, 10)),
    [state.completed]
  );
  const completedDays = useMemo(() => new Set(completedDaysArray), [completedDaysArray]);
  const completedCount = completedDays.size;
  const completionPercent = totalDays > 0 ? Math.min(100, (completedCount / totalDays) * 100) : 0;
  const completedDateKeys = useMemo(
    () => Object.values(state.completed).map((iso) => toDateKey(iso)),
    [state.completed]
  );
  const streaks = useMemo(() => computeStreaks(completedDateKeys), [completedDateKeys]);

  const toggleDay = useCallback(
    (day: number) => {
      if (day < 1 || day > totalDays) {
        return {
          completed: false,
          timestamp: undefined,
          previous: null as { completed: boolean; timestamp?: string } | null,
        };
      }

      let snapshot: { completed: boolean; timestamp?: string } = { completed: false };
      let outcome: { completed: boolean; timestamp?: string } = { completed: false };

      setState((previous) => {
        const next: StoredProgress = {
          completed: { ...previous.completed },
        };
        const existing = previous.completed[day];
        snapshot = {
          completed: Boolean(existing),
          timestamp: existing,
        };
        if (existing) {
          delete next.completed[day];
          outcome = { completed: false, timestamp: undefined };
        } else {
          const iso = new Date().toISOString();
          next.completed[day] = iso;
          outcome = { completed: true, timestamp: iso };
        }
        return next;
      });

      return {
        ...outcome,
        previous: snapshot,
      };
    },
    [totalDays]
  );

  const setDayState = useCallback((day: number, completed: boolean, timestamp?: string) => {
    setState((previous) => {
      const next: StoredProgress = {
        completed: { ...previous.completed },
      };
      if (completed) {
        next.completed[day] = timestamp ?? new Date().toISOString();
      } else {
        delete next.completed[day];
      }
      return next;
    });
  }, []);

  return {
    completedDays,
    completedCount,
    completionPercent,
    streaks,
    toggleDay,
    setDayState,
  };
}
