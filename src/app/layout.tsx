import type { Metadata, Viewport } from 'next';
import './globals.css';
import './print.css';
import { Toaster } from '@/components/ui/toaster';
import { PwaServiceWorker } from '@/components/pwa-service-worker';

export const metadata: Metadata = {
  title: 'Architectural Specification Suite',
  description:
    'Professional architectural material specification and scheduling software featuring offline storage, responsive layout, Gemini AI assistance, and vector PDF exports.',
  applicationName: 'ArchSpec',
  authors: [{ name: 'CodeTech by Sachin Sheth' }],
  keywords: [
    'architectural specification',
    'material schedule',
    'interior design schedule',
    'construction specification',
    'PDF export',
    'PWA',
  ],
  openGraph: {
    type: 'website',
    title: 'Architectural Specification Suite',
    description:
      'Professional architectural material specification and scheduling software featuring offline storage, responsive layout, Gemini AI assistance, and vector PDF exports.',
    siteName: 'Architectural Specification Suite',
    images: [
      {
        url: '/screenshot-wide.png',
        width: 1280,
        height: 720,
        alt: 'Architectural Specification Suite workspace preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architectural Specification Suite',
    description:
      'Professional architectural material specification and scheduling software featuring offline storage, AI assistance, and vector PDF exports.',
    images: ['/screenshot-wide.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ArchSpec',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#045E7D' },
    { media: '(prefers-color-scheme: dark)', color: '#023b4f' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background antialiased selection:bg-primary/20 selection:text-primary">
        {children}
        <PwaServiceWorker />
        <Toaster />
      </body>
    </html>
  );
}
