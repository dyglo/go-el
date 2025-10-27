'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      return stored === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch {}
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      try {
        localStorage.setItem('theme', 'dark');
      } catch {}
    }
  }, [theme]);

  return (
    <Button
      variant="outline"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="mx-auto flex items-center gap-2"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 text-golden" />
          <span className="text-sm">Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-golden" />
          <span className="text-sm">Dark mode</span>
        </>
      )}
    </Button>
  );
}
