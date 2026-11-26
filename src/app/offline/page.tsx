'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <WifiOff className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            You are offline
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your saved architectural schedules remain available locally on this device. Reconnect to access AI suggestions or load uncached pages.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => window.location.reload()}
            className="flex-1 min-h-[44px] gap-2 bg-primary hover:bg-primary/90 font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </Button>
          <Button asChild variant="outline" className="flex-1 min-h-[44px] gap-2">
            <Link href="/projects">
              <FolderOpen className="h-4 w-4" />
              Saved Projects
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
