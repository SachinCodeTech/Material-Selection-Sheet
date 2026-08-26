'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Info, ShieldCheck, HelpCircle, UserCog, Download, Smartphone } from 'lucide-react';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

interface NavigationFooterProps {
  showAdmin?: boolean;
}

export function NavigationFooter({ showAdmin = true }: NavigationFooterProps) {
  const router = useRouter();
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  return (
    <>
      <footer className="w-full flex flex-col items-center space-y-3 py-6 px-4 glass-footer text-muted-foreground transition-all">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors p-0 h-auto gap-1 text-xs sm:text-sm"
            onClick={() => router.push('/about')}
          >
            <Info className="h-3.5 w-3.5" />
            <span>About</span>
          </Button>

          <span className="text-border/70">•</span>

          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors p-0 h-auto gap-1 text-xs sm:text-sm"
            onClick={() => router.push('/privacy')}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </Button>

          <span className="text-border/70">•</span>

          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors p-0 h-auto gap-1 text-xs sm:text-sm"
            onClick={() => router.push('/help')}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help & FAQs</span>
          </Button>

          <span className="text-border/70">•</span>

          <Button
            variant="link"
            size="sm"
            className="text-primary hover:text-primary/80 font-medium transition-colors p-0 h-auto gap-1 text-xs sm:text-sm"
            onClick={() => setIsInstallOpen(true)}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </Button>

          {showAdmin && (
            <>
              <span className="text-border/70">•</span>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors p-0 h-auto gap-1 text-xs sm:text-sm"
                onClick={() => router.push('/admin')}
              >
                <UserCog className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground/85 tracking-wide text-center">
          MSS-v.1.0 | <span className="font-semibold text-foreground/90">CodeTech</span> | by Sachin Sheth
        </p>
      </footer>

      <PwaInstallDialog open={isInstallOpen} onOpenChange={setIsInstallOpen} />
    </>
  );
}
