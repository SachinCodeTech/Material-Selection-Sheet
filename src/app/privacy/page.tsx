'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, Mail, CheckCircle2, Download } from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* Frosted Glass Header */}
      <header className="w-full glass-header px-4 py-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          size="sm"
          className="gap-2 text-primary font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInstallDialogOpen(true)}
            className="hidden sm:inline-flex gap-1.5 text-xs bg-white/60 border-white/70 backdrop-blur-md hover:bg-white/90 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Install App</span>
          </Button>
          <Badge variant="outline" className="glass-badge text-primary font-mono text-xs">
            Effective: August 2026
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <Badge className="glass-badge text-primary font-semibold">
              Privacy & Data Protection
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            This Privacy Policy details how CodeTech, led by Sachin Sheth, safeguards your project specifications, account data, and user preferences within the Material Selection Sheet application.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Data Storage */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              1. Local Storage & Client-Side Data Architecture
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Material Selection Sheet prioritizes privacy and low-latency performance by maintaining all registered user sessions, material schedules, section tables, and custom company names directly within your device's browser <strong className="text-foreground">Local Storage</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/60 border border-white/80 text-xs space-y-1 backdrop-blur-sm">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Device Isolation
                  </span>
                  <p>Your confidential architectural dimensions and pricing sheets never leak to third-party ad networks.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/60 border border-white/80 text-xs space-y-1 backdrop-blur-sm">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Instant Erase Controls
                  </span>
                  <p>You can purge individual user profiles or execute a full application factory reset at any time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: AI Processing */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              2. AI Assistant & Specification Queries
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                When you initiate an AI Material Suggestion or Section Summary generation, the specific material description (such as tile type or dimensions) is processed using Google Gemini models via encrypted server-side requests.
              </p>
              <p>
                No personally identifiable information (PII), passwords, or full project directories are transmitted during AI suggestions. Data sent to AI processing is strictly limited to architectural prompts requested by the active user.
              </p>
            </div>
          </div>

          {/* Section 3: Third Party Tracking */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" />
              3. Zero Third-Party Advertising or Tracking
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>
                CodeTech does not sell, rent, monetize, or share your architectural data with external advertising brokers or behavioral tracking networks.
              </p>
              <p>
                Any PDF exports generated in the application are rendered client-side on your local machine using standard browser print and canvas drivers.
              </p>
            </div>
          </div>

          {/* Section 4: Data Rights & Contact */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              4. Data Controller & Inquiries
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                For questions regarding this policy, data protection inquiries, or software verification, please reach out to:
              </p>
              <div className="p-4 rounded-xl bg-white/60 border border-white/80 space-y-1.5 backdrop-blur-sm">
                <p className="font-bold text-foreground">CodeTech Software Development</p>
                <p className="text-xs">Lead Developer: <span className="text-foreground font-semibold">Sachin Sheth</span></p>
                <p className="text-xs">
                  Email:{' '}
                  <a
                    href="mailto:codetech.appstore@gmail.com"
                    className="text-primary font-semibold hover:underline"
                  >
                    codetech.appstore@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NavigationFooter />
      <PwaInstallDialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen} />
    </div>
  );
}
