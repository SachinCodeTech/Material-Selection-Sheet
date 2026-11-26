import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Architectural Specification Suite',
    short_name: 'ArchSpec',
    description:
      'Professional architectural material specification and scheduling software featuring offline storage, AI assistance, and vector PDF exports.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'any',
    lang: 'en',
    dir: 'ltr',
    background_color: '#F0F4F8',
    theme_color: '#045E7D',
    categories: ['productivity', 'business', 'utilities'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-1024x1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Architectural Specification Suite — Desktop Workspace & Schedule Editor',
      },
      {
        src: '/screenshot-mobile.png',
        sizes: '540x960',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Architectural Specification Suite — Mobile Project Management',
      },
    ],
    shortcuts: [
      {
        name: 'Projects',
        short_name: 'Projects',
        url: '/projects',
        description: 'Manage, search, and create architectural material schedules',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Help & Guide',
        short_name: 'Help',
        url: '/help',
        description: 'View instructions, shortcuts, and FAQs',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
  };
}
