'use client';
import { useEffect, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';

export function PwaServiceWorker() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register service worker if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA Service Worker active:', registration.scope);
            // Check for updates
            registration.update().catch(() => {});
          })
          .catch((err) => {
            console.warn('SW registration info:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span>Working Offline • Data Saved Locally</span>
    </div>
  );
}
