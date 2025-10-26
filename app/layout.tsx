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
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

