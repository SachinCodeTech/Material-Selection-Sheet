'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
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
import {
  ScanLine,
  Camera,
  CameraOff,
  Upload,
  Link2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectQrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectResolved: (projectId: string) => void;
}

const SAFE_PROJECT_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Strictly validates a scanned QR value or pasted project URL and extracts only
 * an internal `/project/<projectId>` identifier. Blocks `javascript:`, `data:`,
 * and external open-redirect targets.
 */
export function extractSafeProjectId(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  // Allow direct relative `/project/<id>` paths
  if (trimmed.startsWith('/project/')) {
    const segment = trimmed.slice('/project/'.length).split(/[/?#]/)[0];
    const decoded = safeDecodeSegment(segment);
    return decoded && SAFE_PROJECT_ID_RE.test(decoded) ? decoded : null;
  }

  // Allow raw UUID / project ID pasted directly
  if (!trimmed.includes(':') && !trimmed.includes('/') && SAFE_PROJECT_ID_RE.test(trimmed)) {
    return trimmed;
  }

  // Parse absolute URLs and strictly allow only http: or https:
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const match = parsed.pathname.match(/^\/project\/([^/]+)\/?$/);
    if (!match) return null;
    const decoded = safeDecodeSegment(match[1]);
    return decoded && SAFE_PROJECT_ID_RE.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function safeDecodeSegment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function ProjectQrScannerDialog({
  open,
  onOpenChange,
  onProjectResolved,
}: ProjectQrScannerDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasDetectedRef = useRef(false);

  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualUrl, setManualUrl] = useState('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDecodedValue = useCallback(
    (rawValue: string) => {
      const projectId = extractSafeProjectId(rawValue);
      if (!projectId) {
        setScanFeedback(
          'QR code does not contain a valid project link (expected .../project/<id>).'
        );
        return false;
      }

      hasDetectedRef.current = true;
      stopCamera();
      setScanFeedback(null);
      onOpenChange(false);
      onProjectResolved(projectId);
      return true;
    },
    [onOpenChange, onProjectResolved, stopCamera]
  );

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopCamera();
      hasDetectedRef.current = false;
      setCameraError(null);
      setScanFeedback(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraStatus('error');
        setCameraError(
          'Camera access is not available in this browser. Upload a QR image or paste the project URL below.'
        );
        return;
      }

      setCameraStatus('starting');

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: mode } },
            audio: false,
          });
        } catch {
          // Fallback to any available camera if ideal facingMode is unavailable
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        const videoEl = videoRef.current;
        if (!videoEl) {
          stopCamera();
          return;
        }

        videoEl.srcObject = stream;
        videoEl.setAttribute('playsinline', 'true');
        await videoEl.play();
        setCameraStatus('active');

        const scanFrame = () => {
          if (hasDetectedRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) return;

          if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            const width = video.videoWidth;
            const height = video.videoHeight;
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });
              if (decoded?.data) {
                const handled = handleDecodedValue(decoded.data);
                if (handled) return;
              }
            }
          }

          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        stopCamera();
        setCameraStatus('error');
        const message =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access or upload a QR image below.'
            : 'Unable to access the camera on this device. Upload a QR image or paste a project link below.';
        setCameraError(message);
      }
    },
    [handleDecodedValue, stopCamera]
  );

  useEffect(() => {
    if (open) {
      setManualUrl('');
      setScanFeedback(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      setCameraStatus('idle');
    }
    return () => {
      stopCamera();
    };
  }, [open, facingMode, startCamera, stopCamera]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const bitmapUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setScanFeedback('Could not process the selected image.');
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (decoded?.data) {
            handleDecodedValue(decoded.data);
          } else {
            setScanFeedback('No QR code detected in that image. Try a clearer photo or screenshot.');
          }
        } finally {
          URL.revokeObjectURL(bitmapUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(bitmapUrl);
        setScanFeedback('Selected file could not be read as an image.');
      };
      img.src = bitmapUrl;
    } catch {
      toast({
        title: 'Image Scan Failed',
        description: 'Could not read the selected QR image.',
        variant: 'destructive',
      });
    }
  };

  const handleManualOpen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    handleDecodedValue(manualUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 shadow-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <ScanLine className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Scan Project QR Code
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Scan a project QR code from another device to open that material schedule instantly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Camera Viewfinder */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-200 aspect-[4/3] flex items-center justify-center">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'}`}
            />
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

            {/* Scanning frame guide overlay */}
            {cameraStatus === 'active' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-44 w-44 rounded-2xl border-2 border-white/85 shadow-[0_0_0_9999px_rgba(15,23,42,0.42)] relative">
                  <span className="absolute -top-0.5 -left-0.5 h-5 w-5 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 border-b-4 border-r-4 border-primary rounded-br-xl" />
                </div>
              </div>
            )}

            {cameraStatus === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-200 px-4 text-center">
                <Camera className="h-7 w-7 animate-pulse text-primary" />
                <p className="text-xs font-medium">Starting camera...</p>
              </div>
            )}

            {cameraStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-slate-200 px-5 text-center bg-slate-900">
                <CameraOff className="h-7 w-7 text-slate-400" />
                <p className="text-xs leading-relaxed text-slate-300">{cameraError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => startCamera(facingMode)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry Camera
                </Button>
              </div>
            )}

            {/* Camera flip control */}
            {cameraStatus === 'active' && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="absolute bottom-2.5 right-2.5 h-8 px-2.5 gap-1.5 text-xs bg-white/90 text-slate-900 hover:bg-white shadow"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Flip
              </Button>
            )}
          </div>

          {scanFeedback && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{scanFeedback}</span>
            </div>
          )}

          {/* Upload QR Image Fallback */}
          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[40px] gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" />
              <span>Upload QR Code Image</span>
            </Button>
          </div>

          {/* Paste Project URL Fallback */}
          <form onSubmit={handleManualOpen} className="space-y-1.5">
            <label
              htmlFor="manual-project-url"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Link2 className="h-3.5 w-3.5 text-primary" />
              Or paste project link
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="manual-project-url"
                value={manualUrl}
                onChange={(e) => {
                  setManualUrl(e.target.value);
                  if (scanFeedback) setScanFeedback(null);
                }}
                placeholder="https://.../project/..."
                className="h-10 text-xs font-mono bg-slate-50 border-slate-200"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!manualUrl.trim()}
                className="h-10 px-3.5 gap-1 bg-primary hover:bg-primary/90 text-white shrink-0"
              >
                <span>Open</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter>
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
