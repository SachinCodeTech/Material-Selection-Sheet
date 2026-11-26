'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function PWAInstallButton({
  variant = 'outline',
  size = 'sm',
  className = '',
  label = 'Install App',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showDialog, setShowDialog] = useState(false);

  // Automatically suppress button when already running in standalone installed mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowDialog(true);
      }
      return;
    }
    setShowDialog(true);
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`gap-1.5 whitespace-nowrap shrink-0 min-h-[40px] ${className}`}
        aria-label={isIOS ? 'Install on iOS' : label}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{isIOS ? 'Install on iOS' : label}</span>
      </Button>

      <PwaInstallDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
