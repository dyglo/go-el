import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GO\'EL - Scripture Community',
  description: 'A global Christian community for sharing, reading, and meditating on Scripture',
  manifest: '/manifest.webmanifest',
  themeColor: '#000000',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-maskable.svg',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Inline script sets the initial theme (runs before React hydration) to avoid
   * a flash of incorrect styling. It reads `localStorage.theme` and applies
   * either `light` or `dark` on the <html> element. If no preference exists, we
   * keep the server-rendered `dark` class.
   */
  const setInitialTheme = `(() => {
    try {
      const theme = localStorage.getItem('theme');
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    } catch (e) {
      // ignore
    }
  })()`;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
