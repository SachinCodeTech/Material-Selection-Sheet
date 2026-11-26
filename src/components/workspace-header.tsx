'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ChevronRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface WorkspaceHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  rightAction?: React.ReactNode;
  hideNavLinks?: boolean;
}

const NAV_LINKS = [
  { label: 'Projects', href: '/projects' },
  { label: 'Admin', href: '/admin' },
  { label: 'Help', href: '/help' },
  { label: 'About', href: '/about' },
];

export function WorkspaceHeader({
  breadcrumbs,
  rightAction,
  hideNavLinks = false,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/projects') {
      return pathname === '/projects' || pathname.startsWith('/project/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="w-full glass-header sticky top-0 z-30 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark + optional contextual breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Layers className="h-4 w-4" />
            </span>
            <span className="text-sm sm:text-base font-extrabold tracking-tight">
              ArchSpec
            </span>
          </Link>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0"
            >
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground truncate max-w-[200px] lg:max-w-[280px]">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        {!hideNavLinks && (
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'text-primary font-semibold after:absolute after:inset-x-0 after:-bottom-[17px] after:h-[2px] after:bg-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Primary action + mobile menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {rightAction}
          {!hideNavLinks && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden h-10 w-10 text-foreground"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {!hideNavLinks && mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-border/70 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{link.label}</span>
                {active && <span className="text-xs text-primary">Current</span>}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
