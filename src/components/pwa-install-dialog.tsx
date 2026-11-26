'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  CheckCircle2,
  Laptop,
  Layers,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function PwaInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isInstallable, isInstalled, os, install } = usePWAInstall();

  const handleInstallClick = async () => {
    const accepted = await install();
    if (accepted) {
      onOpenChange(false);
    }
  };

  const osLabel =
    os === 'ios'
      ? 'iPhone & iPad (Safari)'
      : os === 'android'
        ? 'Android (Chrome)'
        : os === 'mac'
          ? 'macOS Desktop'
          : os === 'windows'
            ? 'Windows Desktop'
            : os === 'linux'
              ? 'Linux Desktop'
              : 'Desktop & Mobile';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card border-white/40 shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Install ArchSpec App
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Full-screen app window · Instant home screen launch · Works offline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isInstalled ? (
          <div className="py-6 text-center space-y-3 bg-primary/5 rounded-xl border border-primary/15 p-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-foreground">Installed & Running in App Mode</h4>
              <p className="text-xs text-muted-foreground">
                Architectural Specification Suite is installed on this device and ready for offline field use.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Quick capabilities */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-card/80 border border-border/60 text-center space-y-1">
                <Laptop className="h-4 w-4 mx-auto text-primary" />
                <p className="text-xs font-semibold text-foreground">Cross-Platform</p>
                <p className="text-[11px] text-muted-foreground">iOS, Android, Desktop</p>
              </div>
              <div className="p-3 rounded-xl bg-card/80 border border-border/60 text-center space-y-1">
                <Layers className="h-4 w-4 mx-auto text-primary" />
                <p className="text-xs font-semibold text-foreground">Native Shell</p>
                <p className="text-[11px] text-muted-foreground">Standalone window</p>
              </div>
              <div className="p-3 rounded-xl bg-card/80 border border-border/60 text-center space-y-1">
                <WifiOff className="h-4 w-4 mx-auto text-primary" />
                <p className="text-xs font-semibold text-foreground">Offline Ready</p>
                <p className="text-[11px] text-muted-foreground">Local schedule storage</p>
              </div>
            </div>

            {/* Platform instructions */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  {os === 'ios' || os === 'android' ? (
                    <Smartphone className="h-4 w-4 text-primary" />
                  ) : (
                    <Monitor className="h-4 w-4 text-primary" />
                  )}
                  Installation Guide · {osLabel}
                </span>
              </div>

              {os === 'ios' ? (
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">1.</span> In Safari, tap the{' '}
                    <span className="font-semibold text-foreground inline-flex items-center gap-1 bg-card px-1.5 py-0.5 rounded border border-border">
                      <Share className="h-3 w-3 text-primary" /> Share
                    </span>{' '}
                    button in the browser toolbar.
                  </p>
                  <p className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">2.</span> Scroll down and tap{' '}
                    <span className="font-semibold text-foreground inline-flex items-center gap-1 bg-card px-1.5 py-0.5 rounded border border-border">
                      <PlusSquare className="h-3 w-3 text-primary" /> Add to Home Screen
                    </span>
                    .
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">3.</span> Tap <strong className="text-foreground">Add</strong> to launch ArchSpec directly from your Home Screen.
                  </p>
                </div>
              ) : os === 'android' ? (
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">1.</span> Tap <strong className="text-foreground">Install Now</strong> below when prompted.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">2.</span> Or open Chrome menu (<strong>⋮</strong>) and choose <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">1.</span> Click <strong className="text-foreground">Install Now</strong> below if available in your browser.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-foreground">2.</span> Or click the <strong className="text-foreground">Install icon</strong> in the right side of your Chrome, Edge, or Brave address bar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {!isInstalled && isInstallable && (
            <Button
              onClick={handleInstallClick}
              className="w-full sm:w-auto min-h-[44px] gap-2 bg-primary text-primary-foreground font-semibold"
            >
              <Download className="h-4 w-4" /> Install Now
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
