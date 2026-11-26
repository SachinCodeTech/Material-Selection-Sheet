'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

interface NavigationFooterProps {
  showAdmin?: boolean;
}

export function NavigationFooter({ showAdmin = true }: NavigationFooterProps) {
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  return (
    <>
      <footer className="w-full glass-footer text-muted-foreground no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            <span className="font-semibold text-foreground">Architectural Specification Suite</span> · CodeTech by Sachin Sheth
          </p>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium"
          >
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Projects
            </Link>
            {showAdmin && (
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Admin
              </Link>
            )}
            <Link
              href="/help"
              className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Help &amp; FAQs
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-primary hover:text-primary/80 font-semibold p-0 h-auto gap-1 text-xs whitespace-nowrap"
              onClick={() => setIsInstallOpen(true)}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </Button>
          </nav>
        </div>
      </footer>

      <PwaInstallDialog open={isInstallOpen} onOpenChange={setIsInstallOpen} />
    </>
  );
}
