'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  Laptop,
  Layers,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [os, setOs] = useState<'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'other'>('other');

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    // Detect user OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    } else if (/win/.test(userAgent)) {
      setOs('windows');
    } else if (/mac/.test(userAgent)) {
      setOs('mac');
    } else if (/linux/.test(userAgent)) {
      setOs('linux');
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('PWA Service Worker registered.'))
        .catch((err) => console.warn('SW registration warning:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        onOpenChange(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card border-white/40 shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Install Application
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Desktop & Mobile • Fast Native Performance • Offline Capable
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isStandalone ? (
          <div className="py-6 text-center space-y-3 bg-primary/5 rounded-xl border border-primary/15 p-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-foreground">Application Running in Native Window</h4>
              <p className="text-xs text-muted-foreground">
                You are currently running Material Selection Sheet as an installed desktop or mobile application.
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
              Installed & Active
            </Badge>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Quick benefits */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-card/70 border border-white/30 text-center space-y-1">
                <Laptop className="h-4 w-4 mx-auto text-primary" />
                <p className="text-[11px] font-semibold text-foreground">Cross-Platform</p>
                <p className="text-[10px] text-muted-foreground">Windows, Mac, iOS, Android</p>
              </div>
              <div className="p-2.5 rounded-lg bg-card/70 border border-white/30 text-center space-y-1">
                <Layers className="h-4 w-4 mx-auto text-primary" />
                <p className="text-[11px] font-semibold text-foreground">Native Window</p>
                <p className="text-[10px] text-muted-foreground">No browser URL bar</p>
              </div>
              <div className="p-2.5 rounded-lg bg-card/70 border border-white/30 text-center space-y-1">
                <Sparkles className="h-4 w-4 mx-auto text-primary" />
                <p className="text-[11px] font-semibold text-foreground">1-Click Launch</p>
                <p className="text-[10px] text-muted-foreground">Dock & Home Screen icon</p>
              </div>
            </div>

            {/* Platform instructions */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  {os === 'ios' && <Smartphone className="h-3.5 w-3.5 text-primary" />}
                  {os === 'android' && <Smartphone className="h-3.5 w-3.5 text-primary" />}
                  {(os === 'windows' || os === 'mac' || os === 'linux') && (
                    <Monitor className="h-3.5 w-3.5 text-primary" />
                  )}
                  Installation Guide for {os.toUpperCase()}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Direct Install
                </Badge>
              </div>

              {os === 'ios' ? (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">1.</span> In Safari, tap the{' '}
                    <span className="font-semibold text-foreground inline-flex items-center gap-1 bg-card px-1.5 py-0.5 rounded border">
                      <Share className="h-3 w-3 text-primary" /> Share
                    </span>{' '}
                    button at the bottom or top bar.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">2.</span> Scroll down and tap{' '}
                    <span className="font-semibold text-foreground inline-flex items-center gap-1 bg-card px-1.5 py-0.5 rounded border">
                      <PlusSquare className="h-3 w-3 text-primary" /> Add to Home Screen
                    </span>.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">3.</span> Tap <strong className="text-foreground">Add</strong> in the top right to launch from your home screen.
                  </p>
                </div>
              ) : os === 'android' ? (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">1.</span> Click the <strong className="text-foreground">Install App</strong> button below.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">2.</span> Or tap Chrome's menu (<strong>⋮</strong>) and select <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">1.</span> Click the <strong className="text-foreground">Install App</strong> button below.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">2.</span> Or look for the <strong className="text-foreground">Install Icon (⊕ or 💻)</strong> on the right side of your browser address bar (Chrome, Edge, Brave).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {!isStandalone && deferredPrompt && (
            <Button onClick={handleInstallClick} className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground">
              <Download className="h-4 w-4" /> Install Now
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
