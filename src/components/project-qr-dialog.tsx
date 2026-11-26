'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Copy, Check, Download, Smartphone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}

export function ProjectQrDialog({
  open,
  onOpenChange,
  projectName,
}: ProjectQrDialogProps) {
  const { toast } = useToast();
  const [projectUrl, setProjectUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    setProjectUrl(currentUrl);
    setCopied(false);
    setIsGenerating(true);

    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
        setQrDataUrl(null);
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [open]);

  const handleCopyUrl = async () => {
    if (!projectUrl) return;
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      toast({
        title: 'Project link copied',
        description: 'Ready to paste or share with your team.',
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        title: 'Unable to copy link',
        description: 'Please select and copy the URL manually.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const sanitizedName = (projectName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${sanitizedName}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'QR code downloaded',
      description: `Saved as ${sanitizedName}_qr.png`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 shadow-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-slate-900 truncate">
                Open on Mobile
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Scan to open <strong className="text-slate-700">{projectName || 'this project'}</strong> on a phone or tablet.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Scannable QR Container */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center w-[240px] h-[240px]">
            {isGenerating ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for project ${projectName}`}
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <p className="text-xs text-slate-500 text-center px-4">
                Unable to generate QR code for this URL.
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1.5 text-center">
            <Smartphone className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Point your iOS or Android camera at the code above</span>
          </p>

          {/* Direct URL Copy Bar */}
          <div className="w-full flex items-center gap-2">
            <Input
              readOnly
              value={projectUrl}
              aria-label="Project URL"
              className="text-xs font-mono bg-slate-50 border-slate-200 text-slate-700 h-10"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="h-10 px-3 gap-1.5 shrink-0 border-slate-300 text-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            onClick={handleDownloadQr}
            disabled={!qrDataUrl}
            className="w-full sm:w-auto gap-1.5 bg-primary hover:bg-primary/90 text-white min-h-[40px]"
          >
            <Download className="h-4 w-4" />
            <span>Download PNG</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-h-[40px]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
