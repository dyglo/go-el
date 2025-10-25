'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'goel:reminders:daily-scripture';

function readPreference() {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return false;
    }
    return raw === 'true';
  } catch {
    return false;
  }
}

export function useReminderPreference() {
  const [enabled, setEnabled] = useState<boolean>(() => readPreference());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') {
      return 'default';
    }
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return window.Notification.permission;
  });

  useEffect(() => {
    setEnabled(readPreference());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Ignore failures
    }
  }, [enabled]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }
    const result = await window.Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const toggle = useCallback(
    async (value: boolean) => {
      if (value && permission === 'default') {
        const result = await requestPermission();
        if (result !== 'granted') {
          setEnabled(false);
          return;
        }
      }
      setEnabled(value);
    },
    [permission, requestPermission]
  );

  return {
    enabled,
    permission,
    toggle,
  };
}
