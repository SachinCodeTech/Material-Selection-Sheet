'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Project, Section, Material } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Save,
  Printer,
  Share2,
  Loader2,
  Folder,
  X,
  FileText,
  LogOut,
  Trash2,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  AlertTriangle,
  QrCode,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AiSuggestionsDialog } from '@/components/ai-suggestions-dialog';
import { SectionSummaryDialog } from '@/components/section-summary-dialog';
import { NavigationFooter } from '@/components/navigation-footer';
import { WorkspaceHeader } from '@/components/workspace-header';
import { ProjectQrDialog } from '@/components/project-qr-dialog';

const DEFAULT_COLUMNS = [
  'UTILITY AREA',
  'SURFACE AREA',
  'SIZE (MM)',
  'MODEL NAME',
  'COMPANY',
];

const PAGE_FORMATS = ['A4', 'A3', 'Letter', 'Legal'];

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createEmptyMaterial(columns: string[]): Material {
  const mat: Material = {
    id: crypto.randomUUID(),
    'UTILITY AREA': '',
    'SURFACE AREA': '',
    'SIZE (MM)': '',
    'MODEL NAME': '',
    'COMPANY': '',
  };
  columns.forEach((col) => {
    if (!(col in mat)) {
      mat[col] = '';
    }
  });
  return mat;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [isAutosaving, setIsAutosaving] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUser] = useLocalStorage<string | null>('currentUser', null);
  const [pageSize, setPageSize] = useState<string>('A4');

  // Deletion confirmation modal states
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  const [aiMaterial, setAiMaterial] = useState<Material | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [summarySection, setSummarySection] = useState<Section | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  // Section navigation / pagination: 'all' shows every section, or a section ID focuses & pages through sections
  const [activeSectionId, setActiveSectionId] = useState<'all' | string>('all');

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Load project initially with strict authorization and isolation
  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Enforce employee isolation: non-owners cannot access other employees' projects
        const isLegacyDemoMatch = project.owner === 'User1' && currentUser === 'Employee 1';
        if (project.owner && project.owner !== currentUser && !isLegacyDemoMatch) {
          toast({
            title: 'Access Restricted',
            description: 'You do not have authorization to view this project specification.',
            variant: 'destructive',
          });
          router.push('/projects');
          return;
        }

        // Ensure every section has valid columns and materials
        const validatedSections = (project.sections || []).map(sec => ({
          ...sec,
          columns: sec.columns && sec.columns.length > 0 ? sec.columns : [...DEFAULT_COLUMNS],
          materials: sec.materials || [],
        }));
        const validatedProj = { ...project, sections: validatedSections };
        setCurrentProject(validatedProj);
        if (project.pageSize) {
          setPageSize(project.pageSize);
        }
      } else {
        toast({ title: 'Project not found.', variant: 'destructive' });
        router.push('/projects');
      }
    }
  }, [projectId, projects, currentUser, router, toast]);

  const triggerAutosaveFeedback = useCallback(() => {
    setIsAutosaving(true);
    setSaveStatus('saving');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      setIsAutosaving(false);
      setSaveStatus('saved');
    }, 1000);
  }, []);

  // Robust update helper with automatic local sync & 1-second autosave pulse
  const updateCurrentProject = useCallback((field: keyof Project, value: any) => {
    setCurrentProject(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        [field]: value,
        lastModified: new Date().toISOString(),
      };
      // Synchronize immediately to projects storage
      setProjects(all => all.map(p => (p.id === updated.id ? updated : p)));
      return updated;
    });
    triggerAutosaveFeedback();
  }, [setProjects, triggerAutosaveFeedback]);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(newSize);
    updateCurrentProject('pageSize', newSize);
    toast({ title: `Page format set to ${newSize}` });
  };

  const handleAddSection = () => {
    if (currentProject) {
      const newSection: Section = {
        id: crypto.randomUUID(),
        name: `Section ${currentProject.sections.length + 1}`,
        columns: [...DEFAULT_COLUMNS],
        materials: Array.from({ length: 4 }, () => createEmptyMaterial(DEFAULT_COLUMNS)),
      };
      const updatedSections = [...currentProject.sections, newSection];
      updateCurrentProject('sections', updatedSections);
      toast({ title: `Added "${newSection.name}"` });
    }
  };

  const handleDuplicateSection = (section: Section) => {
    if (currentProject) {
      const duplicated: Section = {
        id: crypto.randomUUID(),
        name: `${section.name} (Copy)`,
        columns: [...(section.columns || DEFAULT_COLUMNS)],
        materials: section.materials.map(m => ({
          ...m,
          id: crypto.randomUUID(),
        })),
      };
      const updatedSections = [...currentProject.sections, duplicated];
      updateCurrentProject('sections', updatedSections);
      toast({ title: `Duplicated "${section.name}"` });
    }
  };

  const handleSaveSheet = () => {
    if (currentProject) {
      setIsLoading(true);
      setSaveStatus('saving');
      const projectToSave = { ...currentProject, pageSize, lastModified: new Date().toISOString() };
      setProjects(prev => prev.map(p => (p.id === projectToSave.id ? projectToSave : p)));
      setTimeout(() => {
        setIsLoading(false);
        setSaveStatus('saved');
        toast({ title: 'Project Saved Successfully!' });
      }, 250);
    }
  };

  const exportPDF = async () => {
    if (!currentProject) return;

    toast({ title: `Generating High-Resolution PDF (${pageSize})...` });

    const sectionsHtml = currentProject.sections.map(section => {
      const columns = section.columns && section.columns.length > 0 ? section.columns : DEFAULT_COLUMNS;
      return `
        <div class="section">
          <div class="section-title">${escapeHtml(section.name)}</div>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${section.materials.length === 0 ? `
                <tr>
                  <td colspan="${columns.length}" style="text-align: center; color: #94a3b8; padding: 12px;">No materials recorded.</td>
                </tr>
              ` : section.materials.map(material => `
                <tr>
                  ${columns.map(col => `<td>${escapeHtml(material[col] || '')}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const pdfContent = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; font-size: 8pt; color: #1e293b; background: #ffffff; margin: 0; padding: 0; }
            .pdf-container { width: 100%; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #045E7D; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { font-size: 15pt; font-weight: 800; color: #045E7D; margin: 0; letter-spacing: 0.5px; }
            .header p { font-size: 10pt; font-weight: 600; color: #64748b; margin: 4px 0 0 0; }
            .project-info { display: flex; justify-content: space-between; margin: 12px 0 16px 0; font-size: 10pt; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            .section { margin-bottom: 18px; page-break-inside: avoid; }
            .section-title { font-size: 11pt; font-weight: 700; color: #045E7D; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 4px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-size: 8pt; word-break: break-word; }
            th { background-color: #f1f5f9; font-weight: 700; color: #045E7D; text-transform: uppercase; font-size: 7.5pt; }
            .footer { text-align: center; font-size: 8.5pt; color: #64748b; margin-top: 20px; padding-top: 8px; border-top: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <div class="header">
              <h1>ARCHITECTURAL SPECIFICATION SUITE</h1>
              <p>${escapeHtml(currentProject.companyName || 'Architectural Specification')}</p>
            </div>
            <div class="project-info">
              <div>Project: ${escapeHtml(currentProject.name)}</div>
              <div>Date: ${escapeHtml(currentProject.date)}</div>
            </div>
            ${sectionsHtml}
            <div class="footer">v.1.0 | Architectural Specification Suite | CodeTech</div>
          </div>
        </body>
      </html>
    `;

    const sanitizedFilename = (currentProject.name || 'architectural_specification').replace(/[^a-zA-Z0-9_-]/g, '_');
    const opt = {
      margin:       [12, 10, 12, 10],
      filename:     `${sanitizedFilename}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'mm', format: pageSize.toLowerCase(), orientation: 'portrait' }
    };

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      if (typeof html2pdf === 'function') {
        await html2pdf()
          .from(pdfContent)
          .set(opt)
          .save()
          .catch((err: any) => {
            console.warn('html2pdf fallback to native print:', err);
            window.print();
          });
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('PDF export catch triggered, using print:', e);
      window.print();
    }
  };

  const sharePage = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied!", description: "Project link has been copied to clipboard." });
    }
  };

  const updateSection = (updatedSection: Section) => {
    if (currentProject) {
      const updatedSections = currentProject.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
      updateCurrentProject('sections', updatedSections);
    }
  };

  const confirmDeleteSection = () => {
    if (currentProject && sectionToDelete) {
      const updatedSections = currentProject.sections.filter(s => s.id !== sectionToDelete);
      updateCurrentProject('sections', updatedSections);
      setSectionToDelete(null);
      toast({ title: 'Section removed.' });
    }
  };

  const openAiSuggestions = (material: Material) => {
    setAiMaterial(material);
    setIsAiDialogOpen(true);
  };

  const openSummary = (section: Section) => {
    setSummarySection(section);
    setIsSummaryDialogOpen(true);
  };
  
  const handleApplyAiSuggestions = ({ suggestedSpecifications }: { suggestedSpecifications: string[] }) => {
    if (currentProject && aiMaterial) {
      const updatedSections = currentProject.sections.map(section => ({
        ...section,
        materials: section.materials.map(material => {
          if (material.id === aiMaterial.id) {
            const existingSpecs = material['SURFACE AREA'] ? material['SURFACE AREA'].split(',').map(s => s.trim()).filter(s => s) : [];
            const newSpecs = suggestedSpecifications.filter(s => !existingSpecs.includes(s));
            return {
              ...material,
              'SURFACE AREA': [...existingSpecs, ...newSpecs].join(', '),
            };
          }
          return material;
        }),
      }));
      updateCurrentProject('sections', updatedSections);
    }
  };

  const handleLogout = () => {
    router.push('/');
  };

  if (!currentProject) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </main>
    );
  }

  const sections = currentProject.sections || [];
  const activeSectionIndex =
    activeSectionId === 'all'
      ? -1
      : sections.findIndex((s) => s.id === activeSectionId);
  const effectiveActiveSectionId =
    activeSectionId !== 'all' && activeSectionIndex === -1 ? 'all' : activeSectionId;
  const visibleSections =
    effectiveActiveSectionId === 'all'
      ? sections
      : sections.filter((s) => s.id === effectiveActiveSectionId);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/50">
      {/* Unified 3-Zone Workspace Navigation Header with Breadcrumbs */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: currentProject.name || 'Untitled Project' },
        ]}
        rightAction={
          <Button
            type="button"
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-semibold min-h-[40px] px-3 whitespace-nowrap shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        }
      />

      <main id="pdfArea" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-5">
        
        {/* Project Meta Bar (Project Name & Date) */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center justify-between flex-wrap gap-3 sm:gap-4 no-print border border-slate-200/80 bg-white/95">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-grow max-w-md">
            <Label htmlFor="projectName" className="font-semibold text-sm text-slate-700 whitespace-nowrap">
              Project
            </Label>
            <Input
              id="projectName"
              value={currentProject.name}
              onChange={e => updateCurrentProject('name', e.target.value)}
              className="font-bold text-base bg-white border-slate-300 shadow-sm focus-visible:ring-2 focus-visible:ring-primary h-10"
              placeholder="01"
            />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Label htmlFor="projectDate" className="font-semibold text-sm text-slate-700 whitespace-nowrap">
              Date
            </Label>
            <Input
              id="projectDate"
              type="date"
              value={currentProject.date}
              onChange={e => updateCurrentProject('date', e.target.value)}
              className="bg-white border-slate-300 shadow-sm text-sm font-medium w-auto min-w-[140px] h-10 tabular-nums"
            />
            {/* Auto-save status indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                saveStatus === 'saving'
                  ? 'text-primary bg-primary/5 border-primary/20'
                  : 'text-emerald-700 bg-emerald-50/70 border-emerald-200/70'
              }`}
              title="All edits are stored locally in real-time"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Autosaving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Autosaved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cohesive Primary Action Toolbar */}
        <div className="flex gap-2 sm:gap-2.5 flex-wrap items-center no-print glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 bg-white/95">
          {/* + New Section (Primary Architectural Teal) */}
          <Button
            size="default"
            onClick={handleAddSection}
            className="gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 px-4 text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" /> New Section
          </Button>

          {/* Save (Primary with subtle pulse & micro Autosaving... indicator that clears after ~1s) */}
          <Button
            size="default"
            onClick={handleSaveSheet}
            disabled={isLoading}
            className={`gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 px-4 text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all duration-200 ${
              isAutosaving ? 'ring-2 ring-primary/35 animate-pulse' : ''
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}
            <span className="flex flex-col items-start justify-center leading-tight">
              <span>Save</span>
              {isAutosaving && (
                <span
                  className="text-[9px] font-medium leading-none text-primary-foreground/90 tracking-tight"
                  role="status"
                  aria-live="polite"
                >
                  Autosaving...
                </span>
              )}
            </span>
          </Button>

          <span className="hidden sm:inline-block h-6 w-px bg-border mx-0.5" aria-hidden="true" />

          {/* Export as PDF */}
          <Button
            size="default"
            variant="outline"
            onClick={exportPDF}
            className="gap-1.5 font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 h-10 px-3.5 text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            <Printer className="h-4 w-4 text-primary" /> Export PDF
          </Button>

          {/* Page Format Dropdown (A4, A3, Letter, Legal) */}
          <div className="flex items-center">
            <Select value={pageSize} onValueChange={handlePageSizeChange}>
              <SelectTrigger
                aria-label="PDF page format"
                className="h-10 font-semibold bg-white hover:bg-slate-50 text-slate-800 border-slate-300 w-20 sm:w-24 gap-1 px-2.5 sm:px-3 text-xs sm:text-sm"
              >
                <SelectValue placeholder="A4" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                {PAGE_FORMATS.map(fmt => (
                  <SelectItem key={fmt} value={fmt} className="font-semibold text-slate-800">
                    {fmt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QR Code button for mobile handoff */}
          <Button
            size="default"
            variant="outline"
            onClick={() => setIsQrDialogOpen(true)}
            className="gap-1.5 font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 h-10 px-3 text-xs sm:text-sm whitespace-nowrap shrink-0"
            title="Generate QR code to open this project on a mobile device"
          >
            <QrCode className="h-4 w-4 text-primary" />
            <span>QR Code</span>
          </Button>

          {/* Share button */}
          <Button
            size="default"
            variant="outline"
            onClick={sharePage}
            className="gap-1.5 font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 h-10 px-3 hidden sm:inline-flex text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>

          {/* Back to Projects */}
          <Button
            size="default"
            variant="ghost"
            onClick={() => router.push('/projects')}
            className="gap-1.5 font-semibold text-slate-700 hover:text-primary hover:bg-primary/5 h-10 px-3 text-xs sm:text-sm whitespace-nowrap shrink-0 sm:ml-auto"
          >
            <Folder className="h-4 w-4" /> All Projects
          </Button>
        </div>

        {/* Section Navigator & Paginator (Quick Jump + Focus Stepping for multi-section schedules) */}
        {sections.length > 0 && (
          <nav
            aria-label="Project sections"
            className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-sm"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveSectionId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[34px] ${
                  effectiveActiveSectionId === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All Sections ({sections.length})
              </button>
              {sections.map((sec, idx) => {
                const isSelected = effectiveActiveSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors min-h-[34px] max-w-[180px] truncate ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="tabular-nums mr-1 opacity-75">{idx + 1}.</span>
                    {sec.name || `Section ${idx + 1}`}
                  </button>
                );
              })}
            </div>

            {sections.length > 1 && effectiveActiveSectionId !== 'all' && activeSectionIndex >= 0 && (
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <span className="text-xs text-muted-foreground tabular-nums mr-1">
                  Section {activeSectionIndex + 1} of {sections.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeSectionIndex <= 0}
                  onClick={() => setActiveSectionId(sections[activeSectionIndex - 1].id)}
                  className="h-8 px-2.5 gap-1 text-xs bg-white border-slate-300"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeSectionIndex >= sections.length - 1}
                  onClick={() => setActiveSectionId(sections[activeSectionIndex + 1].id)}
                  className="h-8 px-2.5 gap-1 text-xs bg-white border-slate-300"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </nav>
        )}

        {/* Sections Listing */}
        <div id="sections" className="space-y-6">
          {sections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
              <p className="text-slate-600 font-medium text-sm">No sections created in this project yet.</p>
              <Button onClick={handleAddSection} className="gap-2 bg-primary text-white font-semibold">
                <Plus className="h-4 w-4" /> Create First Section
              </Button>
            </div>
          ) : (
            visibleSections.map((section) => {
              const idx = sections.findIndex((s) => s.id === section.id);
              return (
              <div
                key={section.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm printable-section transition-all"
              >
                {/* Section Header & Sub-toolbar */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono font-semibold text-muted-foreground tabular-nums px-1.5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <Input
                        value={section.name}
                        onChange={e => updateSection({ ...section, name: e.target.value })}
                        className="font-extrabold text-base sm:text-lg lg:text-xl border-slate-200 hover:border-slate-300 focus-visible:ring-1 bg-white h-9 sm:h-10 max-w-sm text-slate-900 rounded-lg shadow-sm"
                        placeholder={`Section ${idx + 1}`}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 no-print">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-700 bg-white border-slate-200 hover:bg-slate-100 h-8 gap-1 text-xs font-semibold px-2.5 shadow-sm"
                        onClick={() => handleDuplicateSection(section)}
                        title="Duplicate Section"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Duplicate</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary bg-white border-slate-200 hover:bg-primary/5 h-8 gap-1 text-xs font-semibold px-2.5 shadow-sm"
                        onClick={() => openSummary(section)}
                        title="AI Section Summary"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Summary</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => setSectionToDelete(section.id)}
                        title="Delete Section"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Section Tools: + Add Row | + Add Column | Delete Row | Delete Column */}
                  <SectionControlToolbar
                    section={section}
                    onUpdateSection={updateSection}
                  />
                </div>

                {/* Table Component */}
                <div className="p-3 sm:p-4">
                  <MaterialTableComponent
                    section={section}
                    onUpdateSection={updateSection}
                    onOpenAiSuggestions={openAiSuggestions}
                  />
                </div>
              </div>
              );
            })
          )}

          {/* Bottom Section Pagination Controls when focused on a single section */}
          {sections.length > 1 && effectiveActiveSectionId !== 'all' && activeSectionIndex >= 0 && (
            <div className="no-print flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeSectionIndex <= 0}
                onClick={() => {
                  setActiveSectionId(sections[activeSectionIndex - 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-[40px] px-3.5 gap-1.5 bg-white border-slate-300 text-xs font-semibold"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>
                  {activeSectionIndex > 0
                    ? `Prev: ${sections[activeSectionIndex - 1].name || `Section ${activeSectionIndex}`}`
                    : 'Previous Section'}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveSectionId('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-primary"
              >
                Show All {sections.length} Sections
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeSectionIndex >= sections.length - 1}
                onClick={() => {
                  setActiveSectionId(sections[activeSectionIndex + 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-[40px] px-3.5 gap-1.5 bg-white border-slate-300 text-xs font-semibold"
              >
                <span>
                  {activeSectionIndex < sections.length - 1
                    ? `Next: ${sections[activeSectionIndex + 1].name || `Section ${activeSectionIndex + 2}`}`
                    : 'Next Section'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <div className="no-print">
        <NavigationFooter />
      </div>

      {/* Delete Section Modal Confirmation */}
      <Dialog open={!!sectionToDelete} onOpenChange={open => !open && setSectionToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Section?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to remove this entire section and its recorded specifications? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSectionToDelete(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDeleteSection}>
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {aiMaterial && (
        <AiSuggestionsDialog
          open={isAiDialogOpen}
          onOpenChange={setIsAiDialogOpen}
          material={aiMaterial}
          onApply={handleApplyAiSuggestions}
        />
      )}

      {summarySection && (
        <SectionSummaryDialog
          open={isSummaryDialogOpen}
          onOpenChange={setIsSummaryDialogOpen}
          section={summarySection}
        />
      )}

      <ProjectQrDialog
        open={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
        projectName={currentProject.name}
      />
    </div>
  );
}

/**
 * Section Control Sub-Toolbar: + Add Row | + Add Column | 🗑️ Delete Row | 🗑️ Delete Column
 */
function SectionControlToolbar({
  section,
  onUpdateSection,
}: {
  section: Section;
  onUpdateSection: (section: Section) => void;
}) {
  const { toast } = useToast();
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isDeleteColumnOpen, setIsDeleteColumnOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState('');
  const [isDeleteLastRowOpen, setIsDeleteLastRowOpen] = useState(false);

  const currentColumns = section.columns && section.columns.length > 0 ? section.columns : DEFAULT_COLUMNS;

  const handleAddRow = () => {
    const newMaterial = createEmptyMaterial(currentColumns);
    onUpdateSection({ ...section, materials: [...section.materials, newMaterial] });
    toast({ title: 'Row added' });
  };

  const confirmDeleteLastRow = () => {
    const updatedMaterials = section.materials.slice(0, -1);
    onUpdateSection({ ...section, materials: updatedMaterials });
    setIsDeleteLastRowOpen(false);
    toast({ title: 'Last row deleted' });
  };

  const handleConfirmAddColumn = () => {
    const trimmed = newColumnName.trim().toUpperCase();
    if (!trimmed) {
      toast({ title: 'Please enter a column name', variant: 'destructive' });
      return;
    }
    if (currentColumns.includes(trimmed)) {
      toast({ title: 'Column already exists', variant: 'destructive' });
      return;
    }
    const updatedColumns = [...currentColumns, trimmed];
    const updatedMaterials = section.materials.map(m => ({
      ...m,
      [trimmed]: m[trimmed] || '',
    }));
    onUpdateSection({ ...section, columns: updatedColumns, materials: updatedMaterials });
    setNewColumnName('');
    setIsAddColumnOpen(false);
    toast({ title: `Column "${trimmed}" added` });
  };

  const handleConfirmDeleteColumn = () => {
    if (!columnToDelete) {
      toast({ title: 'Please select a column to delete', variant: 'destructive' });
      return;
    }
    if (currentColumns.length <= 1) {
      toast({ title: 'Table must have at least one column', variant: 'destructive' });
      return;
    }
    const updatedColumns = currentColumns.filter(c => c !== columnToDelete);
    onUpdateSection({ ...section, columns: updatedColumns });
    setColumnToDelete('');
    setIsDeleteColumnOpen(false);
    toast({ title: `Column "${columnToDelete}" deleted` });
  };

  return (
    <div className="flex items-center flex-wrap gap-2 pt-1 no-print">
      {/* + Add Row */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        className="h-8 gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm"
      >
        <Plus className="h-3.5 w-3.5 text-slate-700" /> Add Row
      </Button>

      {/* + Add Column */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAddColumnOpen(true)}
        className="h-8 gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm"
      >
        <Plus className="h-3.5 w-3.5 text-slate-700" /> Add Column
      </Button>

      {/* Delete Row */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (section.materials.length === 0) {
            toast({ title: 'No rows to delete', variant: 'destructive' });
            return;
          }
          setIsDeleteLastRowOpen(true);
        }}
        className="h-8 gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm"
      >
        <Trash2 className="h-3.5 w-3.5 text-slate-500" /> Delete Row
      </Button>

      {/* Delete Column */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setColumnToDelete(currentColumns[currentColumns.length - 1]);
          setIsDeleteColumnOpen(true);
        }}
        className="h-8 gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm"
      >
        <Trash2 className="h-3.5 w-3.5 text-slate-500" /> Delete Column
      </Button>

      {/* Delete Last Row Confirmation Dialog */}
      <Dialog open={isDeleteLastRowOpen} onOpenChange={setIsDeleteLastRowOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Last Row?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to delete the bottom-most row of this section?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteLastRowOpen(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={confirmDeleteLastRow}>Delete Row</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add New Column</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter a name for the new table specification column (e.g. COLOR, QUANTITY, RATE, REMARKS).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="colName" className="text-xs font-semibold text-slate-700">Column Name</Label>
            <Input
              id="colName"
              placeholder="e.g. FINISH / COLOR"
              value={newColumnName}
              onChange={e => setNewColumnName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmAddColumn()}
              className="mt-1 uppercase"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsAddColumnOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmAddColumn} className="bg-primary text-white">Add Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Dialog */}
      <Dialog open={isDeleteColumnOpen} onOpenChange={setIsDeleteColumnOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Delete Column</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select which column to remove from this section:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={columnToDelete} onValueChange={setColumnToDelete}>
              <SelectTrigger className="w-full bg-white border-slate-300">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {currentColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteColumnOpen(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmDeleteColumn}>Delete Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Interactive Material Table with dynamic columns, rows, and drag-and-drop row reordering
 */
const MaterialTableComponent = ({
  section,
  onUpdateSection,
  onOpenAiSuggestions,
}: {
  section: Section;
  onUpdateSection: (section: Section) => void;
  onOpenAiSuggestions: (material: Material) => void;
}) => {
  const { toast } = useToast();
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [draggableRowId, setDraggableRowId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchDraggedIndexRef = useRef<number | null>(null);
  const touchOverIndexRef = useRef<number | null>(null);

  const currentColumns = section.columns && section.columns.length > 0 ? section.columns : DEFAULT_COLUMNS;

  const handleMaterialChange = (materialId: string, field: string, value: string) => {
    const updatedMaterials = section.materials.map(m =>
      m.id === materialId ? { ...m, [field]: value } : m
    );
    onUpdateSection({ ...section, materials: updatedMaterials });
  };

  const reorderRows = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= section.materials.length ||
      toIndex >= section.materials.length
    ) {
      return;
    }
    const updatedMaterials = [...section.materials];
    const [movedRow] = updatedMaterials.splice(fromIndex, 1);
    updatedMaterials.splice(toIndex, 0, movedRow);
    onUpdateSection({ ...section, materials: updatedMaterials });
  };

  const resetDragState = () => {
    setDraggableRowId(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    touchDraggedIndexRef.current = null;
    touchOverIndexRef.current = null;
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    if (draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderRows(draggedIndex, targetIndex);
    }
    resetDragState();
  };

  const handleTouchStart = (index: number) => {
    touchDraggedIndexRef.current = index;
    touchOverIndexRef.current = index;
    setDraggedIndex(index);
    setDragOverIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (touchDraggedIndexRef.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetRow = targetEl?.closest('tr[data-row-index]') as HTMLElement | null;
    if (targetRow && targetRow.dataset.sectionId === section.id) {
      const idx = Number(targetRow.dataset.rowIndex);
      if (!Number.isNaN(idx) && idx !== touchOverIndexRef.current) {
        touchOverIndexRef.current = idx;
        setDragOverIndex(idx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (
      touchDraggedIndexRef.current !== null &&
      touchOverIndexRef.current !== null &&
      touchDraggedIndexRef.current !== touchOverIndexRef.current
    ) {
      reorderRows(touchDraggedIndexRef.current, touchOverIndexRef.current);
    }
    resetDragState();
  };

  const handleHandleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      reorderRows(index, index - 1);
    } else if (e.key === 'ArrowDown' && index < section.materials.length - 1) {
      e.preventDefault();
      reorderRows(index, index + 1);
    }
  };

  const duplicateRow = (material: Material) => {
    const duplicated: Material = {
      ...material,
      id: crypto.randomUUID(),
    };
    onUpdateSection({ ...section, materials: [...section.materials, duplicated] });
    toast({ title: 'Row duplicated' });
  };

  const confirmDeleteRow = () => {
    if (!rowToDelete) return;
    const updatedMaterials = section.materials.filter(m => m.id !== rowToDelete);
    onUpdateSection({ ...section, materials: updatedMaterials });
    setRowToDelete(null);
    toast({ title: 'Row deleted' });
  };

  if (section.materials.length === 0) {
    return (
      <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-300 space-y-2">
        <p className="text-xs text-slate-500 font-medium">No materials in this section yet.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newMaterial = createEmptyMaterial(currentColumns);
            onUpdateSection({ ...section, materials: [newMaterial] });
          }}
          className="gap-1.5 text-xs bg-white text-primary font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> Add First Row
        </Button>
      </div>
    );
  }

  return (
    <div className="table-scroll-container rounded-lg border border-slate-200 bg-white">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100/90 text-primary border-b border-slate-200">
            <th
              className="p-2 w-9 min-w-[36px] text-center border-r border-slate-200 no-print"
              aria-label="Reorder"
            >
              <span className="sr-only">Reorder</span>
            </th>
            {currentColumns.map(header => (
              <th
                key={header}
                className="p-2.5 font-bold text-left tracking-wider uppercase text-[11px] text-slate-800 border-r border-slate-200 last:border-r-0 whitespace-nowrap min-w-[130px] sm:min-w-[150px]"
              >
                {header}
              </th>
            ))}
            <th className="p-2.5 w-24 min-w-[90px] text-center tracking-wider uppercase text-[11px] text-slate-800 no-print">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {section.materials.map((material, rowIndex) => {
            const isDragging = draggedIndex === rowIndex;
            const isDropTarget =
              draggedIndex !== null && dragOverIndex === rowIndex && draggedIndex !== rowIndex;
            const dropLineClass = isDropTarget
              ? draggedIndex < rowIndex
                ? 'shadow-[inset_0_-2px_0_0_#0284c7] bg-sky-50/70'
                : 'shadow-[inset_0_2px_0_0_#0284c7] bg-sky-50/70'
              : '';

            return (
              <tr
                key={material.id}
                data-row-index={rowIndex}
                data-section-id={section.id}
                draggable={draggableRowId === material.id}
                onDragStart={(e) => handleDragStart(e, rowIndex)}
                onDragOver={(e) => handleDragOver(e, rowIndex)}
                onDrop={(e) => handleDrop(e, rowIndex)}
                onDragEnd={resetDragState}
                className={`transition-colors ${
                  isDragging ? 'opacity-45 bg-slate-100/80' : 'hover:bg-sky-50/40'
                } ${dropLineClass}`}
              >
                <td className="p-1 text-center border-r border-slate-200 no-print w-9 min-w-[36px]">
                  <button
                    type="button"
                    onMouseDown={() => setDraggableRowId(material.id)}
                    onMouseUp={() => setDraggableRowId(null)}
                    onTouchStart={() => handleTouchStart(rowIndex)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onKeyDown={(e) => handleHandleKeyDown(e, rowIndex)}
                    title="Drag to reorder row (or focus and press Up/Down arrows)"
                    aria-label={`Reorder row ${rowIndex + 1}`}
                    className="inline-flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </td>
                {currentColumns.map(header => {
                  const isNumeric = /size|qty|quantity|dimension|area|mm|rate|price|amount|no/i.test(header);
                  return (
                    <td key={`${material.id}-${header}`} className="p-1 sm:p-1.5 border-r border-slate-200 last:border-r-0 min-w-[130px] sm:min-w-[150px]">
                      <Input
                        className="text-xs h-8 sm:h-9 border-transparent hover:border-slate-300 focus-visible:border-primary focus-visible:ring-1 bg-transparent rounded-md transition-all font-medium text-slate-800 w-full"
                        value={material[header] || ''}
                        placeholder={header.toLowerCase()}
                        inputMode={isNumeric ? 'decimal' : 'text'}
                        onChange={e => handleMaterialChange(material.id, header, e.target.value)}
                      />
                    </td>
                  );
                })}
                <td className="p-1 sm:p-1.5 text-center no-print w-24 min-w-[90px]">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      onClick={() => onOpenAiSuggestions(material)}
                      title="Gemini AI Suggestions"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-600 hover:bg-slate-100"
                      onClick={() => duplicateRow(material)}
                      title="Duplicate Row"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setRowToDelete(material.id)}
                      title="Delete Row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Row Deletion Confirmation Dialog */}
      <Dialog open={!!rowToDelete} onOpenChange={open => !open && setRowToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Row?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to remove this material entry from the specification sheet?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRowToDelete(null)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={confirmDeleteRow}>Delete Row</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
