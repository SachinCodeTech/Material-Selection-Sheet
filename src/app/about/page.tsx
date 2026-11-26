'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Building2, User, Sparkles, Layers, Shield, HelpCircle, Download } from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { WorkspaceHeader } from '@/components/workspace-header';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

export default function AboutPage() {
  const router = useRouter();
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col justify-between">
      <WorkspaceHeader breadcrumbs={[{ label: 'About' }]} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero title */}
        <div className="space-y-3 text-center sm:text-left">
          <Badge className="glass-badge text-primary px-3.5 py-1 text-xs font-semibold shadow-sm">
            Architectural Specification Platform
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            About Architectural Specification Suite
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A comprehensive, digital-first architectural scheduling and material specification platform engineered for architects, interior designers, contractors, and project managers.
          </p>
        </div>

        {/* Company & Developer Card with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Company</h2>
                <p className="text-xs text-muted-foreground">Organization & Product Brand</p>
              </div>
            </div>
            <div className="space-y-3 text-sm pt-2">
              <div className="flex items-center justify-between py-1.5 border-b border-border/70">
                <span className="text-muted-foreground">Entity Name</span>
                <span className="font-semibold text-foreground">CodeTech</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/70">
                <span className="text-muted-foreground">App Suite</span>
                <span className="font-medium text-foreground">Architectural Specification Suite</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Official Contact</span>
                <a
                  href="mailto:codetech.appstore@gmail.com"
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" />
                  codetech.appstore@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/20 text-accent-foreground border border-accent/30 shadow-sm">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Lead Developer</h2>
                <p className="text-xs text-muted-foreground">Engineering & Architecture</p>
              </div>
            </div>
            <div className="space-y-3 text-sm pt-2">
              <div className="flex items-center justify-between py-1.5 border-b border-border/70">
                <span className="text-muted-foreground">Lead Engineer</span>
                <span className="font-semibold text-foreground">Sachin Sheth</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/70">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium text-foreground">Full Stack Architecture & Design</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Developer Inquiries</span>
                <a
                  href="mailto:codetech.appstore@gmail.com"
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" />
                  codetech.appstore@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Core Capabilities with Glass Panels */}
        <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Layers className="h-5 w-5" />
              <h2 className="text-xl font-bold text-foreground">Core Capabilities</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Engineered to streamline the entire lifecycle of material curation and client presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/60 border border-white/80 space-y-2 backdrop-blur-sm shadow-sm">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Dynamic Scheduling
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Organize materials by room, surface, utility area, dimensions (MM), model specifications, and manufacturer companies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/60 border border-white/80 space-y-2 backdrop-blur-sm shadow-sm">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Intelligence
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Leverage Google Gemini to discover related material specifications, anti-skid ratings, and auto-generated section summaries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/60 border border-white/80 space-y-2 backdrop-blur-sm shadow-sm">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                High-Resolution Export
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instantly produce vector, print-ready PDF specification sheets with customizable corporate branding and zero watermarks.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Contact & Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl glass-panel shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-foreground">Have questions or feature requests?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Direct all feedback and partnership inquiries to CodeTech support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
              <a href="mailto:codetech.appstore@gmail.com">
                <Mail className="h-4 w-4" />
                Contact CodeTech
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/help')}
              className="gap-2 bg-white/70 border-white/80 backdrop-blur-md shadow-sm"
            >
              <HelpCircle className="h-4 w-4" />
              View Help Guide
            </Button>
          </div>
        </div>
      </main>

      <NavigationFooter />
      <PwaInstallDialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen} />
    </div>
  );
}
