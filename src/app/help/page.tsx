'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  HelpCircle,
  Search,
  FolderPlus,
  TableProperties,
  Sparkles,
  FileDown,
  Mail,
  BookOpen,
  Download,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { NavigationFooter } from '@/components/navigation-footer';
import { WorkspaceHeader } from '@/components/workspace-header';
import { PwaInstallDialog } from '@/components/pwa-install-dialog';

const FAQ_ITEMS = [
  {
    id: 'item-0',
    category: 'Installation',
    question: 'How do I install the application on my computer or phone?',
    answer:
      'Click the "Install App" button in the header or footer. On desktop (Windows, macOS, Linux, ChromeOS), click "Install" to launch as a standalone desktop window without browser URL bars. On Android, tap "Install App" in Chrome. On iOS / iPhone / iPad, open Safari, tap the Share button (⎋), and select "Add to Home Screen".',
  },
  {
    id: 'item-1',
    category: 'Getting Started',
    question: 'How do Employees log in or get registered?',
    answer:
      'Employee accounts and teams (Architecture and Interior) are registered and maintained by the Admin inside the Admin Portal. Newly registered employees receive automatic default credentials matching their number (for example, Employee 1 logs in with Password 1, Employee 2 with Password 2) and can change their password anytime from the login screen.',
  },
  {
    id: 'item-2',
    category: 'Projects',
    question: 'How do I create and manage material selection projects?',
    answer:
      'After logging in, you will arrive at the Project Management dashboard. Type your project name in "Create New Project" and click the "+ New Project" button. You can also load existing saved projects or delete old ones.',
  },
  {
    id: 'item-3',
    category: 'Editing Materials',
    question: 'How do I add sections and fill in material specifications?',
    answer:
      'Inside any project, click "+ Add Section" to insert a new room or area (e.g., Living Room, Master Bedroom, Kitchen). Each section includes a table with columns for Utility Area, Surface Area, Size in MM, Model Name, and Company. You can also add more rows or remove sections as needed.',
  },
  {
    id: 'item-4',
    category: 'AI Features',
    question: 'How do AI Material Suggestions and Section Summaries work?',
    answer:
      'Click the AI sparkle icon on any material row to open the "AI Material Suggestions" dialog. Powered by Gemini, it suggests matching materials, anti-skid surfaces, and architectural specifications. You can also click the Summary icon next to a section header to generate an executive summary.',
  },
  {
    id: 'item-5',
    category: 'Export & Sharing',
    question: 'How do I export to PDF or share the specification sheet?',
    answer:
      'In the project toolbar, click the "Export PDF" button. A formatted, high-resolution A4 document with your custom company name, project title, and date will be downloaded. You can also click "Share" to copy the direct project URL to your clipboard.',
  },
  {
    id: 'item-6',
    category: 'Admin & Passwords',
    question: 'How do I access the Admin Dashboard or reset passwords?',
    answer:
      'Click "Admin Panel" on the login screen and enter the admin password ("admin123"). From the Admin Dashboard, you can update the global default company name, inspect registered users, or view and delete any project across the system. Users can also use "Forgot Password?" or "Change Password" directly on the login page.',
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col justify-between">
      <WorkspaceHeader breadcrumbs={[{ label: 'Help & FAQs' }]} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Header Title */}
        <div className="space-y-3 text-center sm:text-left">
          <Badge className="glass-badge text-primary font-semibold">
            Knowledge Base & FAQs
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Help & User Guide
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
            Find answers to common questions, step-by-step guides for architectural scheduling, and contact info for direct developer support.
          </p>
        </div>

        {/* Quick Search with Glass Filter */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics (e.g., install app, export PDF, AI suggestions, admin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white/80 border-white/80 shadow-md backdrop-blur-md text-sm rounded-xl"
          />
        </div>

        {/* Feature Quick Reference Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl glass-panel text-center space-y-1.5 shadow-sm hover:shadow-md transition-all">
            <Download className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs font-bold text-foreground">Installation</p>
            <p className="text-[11px] text-muted-foreground">All OS Guide</p>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center space-y-1.5 shadow-sm hover:shadow-md transition-all">
            <TableProperties className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs font-bold text-foreground">Sections</p>
            <p className="text-[11px] text-muted-foreground">Grid specs</p>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center space-y-1.5 shadow-sm hover:shadow-md transition-all">
            <Sparkles className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs font-bold text-foreground">Gemini AI</p>
            <p className="text-[11px] text-muted-foreground">Smart suggestions</p>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center space-y-1.5 shadow-sm hover:shadow-md transition-all">
            <FileDown className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs font-bold text-foreground">PDF Export</p>
            <p className="text-[11px] text-muted-foreground">Print blueprints</p>
          </div>
        </div>

        {/* FAQ Accordion in Glass Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredFaqs.length} guide{filteredFaqs.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <div>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-border/60">
                    <AccordionTrigger className="text-left font-semibold text-sm hover:no-underline hover:text-primary py-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <Badge variant="outline" className="w-fit text-[10px] py-0 px-2 font-mono">
                          {faq.category}
                        </Badge>
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-1 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No matching help articles found for "{searchQuery}". Try searching for something else or contact support below.
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Banner */}
        <div className="p-6 rounded-2xl glass-panel shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Still need assistance?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Reach out to Lead Developer <strong className="text-foreground">Sachin Sheth</strong> at <strong className="text-foreground">CodeTech</strong>.
            </p>
          </div>
          <Button asChild className="gap-2 shrink-0 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
            <a href="mailto:codetech.appstore@gmail.com?subject=Architectural%20Specification%20Suite%20Help%20Request">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
        </div>
      </main>

      <NavigationFooter />
      <PwaInstallDialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen} />
    </div>
  );
}
