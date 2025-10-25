import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GO'EL - Scripture Community",
    short_name: "GO'EL",
    description: 'A Scripture-first Christian community for reading, sharing, and praying together.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    lang: 'en',
    categories: ['education', 'religion'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Scripture Feed',
        url: '/feed',
        description: 'Open the community scripture feed.',
      },
      {
        name: 'Daily Plans',
        url: '/plans',
        description: 'Jump into the 30-day Gospel journey.',
      },
    ],
  };
}
