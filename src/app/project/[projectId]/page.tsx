'use client';
import { useState, useEffect } from 'react';
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
  Layers,
  Sparkles,
  Columns3,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { AiSuggestionsDialog } from '@/components/ai-suggestions-dialog';
import { SectionSummaryDialog } from '@/components/section-summary-dialog';
import { NavigationFooter } from '@/components/navigation-footer';
import html2pdf from 'html2pdf.js';

const DEFAULT_COLUMNS = [
  'UTILITY AREA',
  'SURFACE AREA',
  'SIZE (MM)',
  'MODEL NAME',
  'COMPANY',
];

const PAGE_FORMATS = ['A4', 'A3', 'Letter', 'Legal'];

export default function ProjectPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useLocalStorage<string | null>('currentUser', null);
  const [pageSize, setPageSize] = useState<string>('A4');

  const [aiMaterial, setAiMaterial] = useState<Material | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [summarySection, setSummarySection] = useState<Section | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        if (project.pageSize) {
          setPageSize(project.pageSize);
        }
      } else {
        toast({ title: 'Project not found.', variant: 'destructive' });
        router.push('/projects');
      }
    }
  }, [projectId, projects, router, toast]);

  const updateCurrentProject = (field: keyof Project, value: any) => {
    if (currentProject) {
      const updatedProject = { ...currentProject, [field]: value, lastModified: new Date().toISOString() };
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(newSize);
    updateCurrentProject('pageSize', newSize);
    toast({ title: `Page size set to ${newSize}` });
  };

  const handleAddSection = () => {
    if (currentProject) {
      const newSection: Section = {
        id: crypto.randomUUID(),
        name: `Section ${currentProject.sections.length + 1}`,
        columns: [...DEFAULT_COLUMNS],
        materials: Array.from({ length: 4 }, () => {
          const mat: Material = { id: crypto.randomUUID() };
          DEFAULT_COLUMNS.forEach(col => {
            mat[col] = '';
          });
          return mat;
        }),
      };
      const updatedSections = [...currentProject.sections, newSection];
      updateCurrentProject('sections', updatedSections);
      toast({ title: `Added "${newSection.name}"` });
    }
  };

  const handleSaveSheet = () => {
    if (currentProject) {
      setIsLoading(true);
      const projectToSave = { ...currentProject, pageSize };
      setProjects(prev => prev.map(p => p.id === projectToSave.id ? projectToSave : p));
      setTimeout(() => {
        setIsLoading(false);
        toast({ title: 'Project Saved Successfully!' });
      }, 350);
    }
  };

  const exportPDF = () => {
    if (!currentProject) return;

    toast({ title: `Generating High-Resolution PDF (${pageSize})...` });

    const sectionsHtml = currentProject.sections.map(section => {
      const columns = section.columns && section.columns.length > 0 ? section.columns : DEFAULT_COLUMNS;
      return `
        <div class="section">
          <div class="section-title">${section.name}</div>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${section.materials.map(material => `
                <tr>
                  ${columns.map(col => `<td>${material[col] || ''}</td>`).join('')}
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
              <h1>MATERIAL SELECTION SHEET</h1>
              <p>${currentProject.companyName || 'Architectural Specification'}</p>
            </div>
            <div class="project-info">
              <div>Project: ${currentProject.name}</div>
              <div>Date: ${currentProject.date}</div>
            </div>
            ${sectionsHtml}
            <div class="footer">MSS-v.1.0 | CodeTech | by Sachin Sheth</div>
          </div>
        </body>
      </html>
    `;

    const opt = {
      margin:       [12, 10, 12, 10], // top, left, bottom, right in mm
      filename:     `${currentProject.name || 'material-selection-sheet'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'mm', format: pageSize.toLowerCase(), orientation: 'portrait' }
    };

    html2pdf().from(pdfContent).set(opt).save();
  };

  const sharePage = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied!", description: "Project link has been copied to your clipboard." });
  };

  const updateSection = (updatedSection: Section) => {
    if (currentProject) {
      const updatedSections = currentProject.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
      updateCurrentProject('sections', updatedSections);
    }
  };

  const deleteSection = (sectionId: string) => {
    if (currentProject) {
      if (window.confirm('Are you sure you want to delete this section?')) {
        const updatedSections = currentProject.sections.filter(s => s.id !== sectionId);
        updateCurrentProject('sections', updatedSections);
      }
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

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/50">
      <main id="pdfArea" className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4">
        
        {/* Project Meta Bar (Project Name & Date) matching reference layout */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between flex-wrap gap-4 no-print shadow-sm border border-slate-200/80 bg-white/90">
          <div className="flex items-center gap-3 flex-grow max-w-md">
            <Label htmlFor="projectName" className="font-bold text-sm sm:text-base text-slate-800 whitespace-nowrap">
              Project:
            </Label>
            <Input
              id="projectName"
              value={currentProject.name}
              onChange={e => updateCurrentProject('name', e.target.value)}
              className="font-bold text-base bg-white border-slate-300 shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="01"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="projectDate" className="font-bold text-sm sm:text-base text-slate-800 whitespace-nowrap">
              Date:
            </Label>
            <Input
              id="projectDate"
              type="date"
              value={currentProject.date}
              onChange={e => updateCurrentProject('date', e.target.value)}
              className="bg-white border-slate-300 shadow-sm text-sm font-medium w-auto min-w-[150px]"
            />
          </div>
        </div>

        {/* Primary Action Toolbar matching Screenshot: + New Section | Save | Export as PDF | A4 v | Projects | Logout */}
        <div className="flex gap-2.5 flex-wrap items-center no-print glass-panel p-3 rounded-xl border border-slate-200/80 bg-white/90 shadow-sm">
          {/* + New Section (Solid Blue) */}
          <Button
            size="default"
            onClick={handleAddSection}
            className="gap-1.5 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm h-10 px-4"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> New Section
          </Button>

          {/* Save (Solid Blue) */}
          <Button
            size="default"
            onClick={handleSaveSheet}
            disabled={isLoading}
            className="gap-1.5 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm h-10 px-4"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>

          {/* Export as PDF (Solid Blue with Printer icon) */}
          <Button
            size="default"
            onClick={exportPDF}
            className="gap-1.5 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm h-10 px-4"
          >
            <Printer className="h-4 w-4" /> Export as PDF
          </Button>

          {/* Page Format Dropdown (A4, A3, Letter, Legal) */}
          <div className="flex items-center">
            <Select value={pageSize} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-10 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white border-0 shadow-sm w-24 gap-1 px-3 text-sm focus:ring-0">
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

          {/* Projects (Solid Warm Amber / Orange) */}
          <Button
            size="default"
            onClick={() => router.push('/projects')}
            className="gap-1.5 font-bold bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-sm h-10 px-4"
          >
            <Folder className="h-4 w-4" /> Projects
          </Button>

          {/* Share button */}
          <Button
            size="default"
            variant="outline"
            onClick={sharePage}
            className="gap-1.5 font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm h-10 px-3 hidden sm:inline-flex"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>

          {/* Logout (Solid Red) */}
          <Button
            size="default"
            onClick={handleLogout}
            className="gap-1.5 font-bold bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-sm h-10 px-4 sm:ml-auto"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Sections Listing */}
        <div id="sections" className="space-y-6">
          {currentProject.sections.map((section, idx) => (
            <div
              key={section.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-md printable-section transition-all"
            >
              {/* Section Header & Sub-toolbar matching reference */}
              <div className="border-b border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={section.name}
                      onChange={e => updateSection({ ...section, name: e.target.value })}
                      className="font-extrabold text-lg sm:text-xl border-slate-200 hover:border-slate-300 focus-visible:ring-1 bg-white h-9 max-w-sm text-slate-900 rounded-lg shadow-sm"
                      placeholder={`Section ${idx + 1}`}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 no-print">
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
                      onClick={() => deleteSection(section.id)}
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
          ))}
        </div>
      </main>

      <div className="no-print">
        <NavigationFooter />
      </div>

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

  const currentColumns = section.columns && section.columns.length > 0 ? section.columns : DEFAULT_COLUMNS;

  const handleAddRow = () => {
    const newMaterial: Material = { id: crypto.randomUUID() };
    currentColumns.forEach(col => {
      newMaterial[col] = '';
    });
    onUpdateSection({ ...section, materials: [...section.materials, newMaterial] });
    toast({ title: 'Row added' });
  };

  const handleDeleteLastRow = () => {
    if (section.materials.length === 0) {
      toast({ title: 'No rows to delete', variant: 'destructive' });
      return;
    }
    if (window.confirm('Delete the last row of this section?')) {
      const updatedMaterials = section.materials.slice(0, -1);
      onUpdateSection({ ...section, materials: updatedMaterials });
      toast({ title: 'Row deleted' });
    }
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
        onClick={handleDeleteLastRow}
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
 * Interactive Material Table with dynamic columns and rows
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
  const currentColumns = section.columns && section.columns.length > 0 ? section.columns : DEFAULT_COLUMNS;

  const handleMaterialChange = (materialId: string, field: string, value: string) => {
    const updatedMaterials = section.materials.map(m =>
      m.id === materialId ? { ...m, [field]: value } : m
    );
    onUpdateSection({ ...section, materials: updatedMaterials });
  };

  const deleteRow = (materialId: string) => {
    if (window.confirm('Delete this row?')) {
      const updatedMaterials = section.materials.filter(m => m.id !== materialId);
      onUpdateSection({ ...section, materials: updatedMaterials });
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100/90 text-primary border-b border-slate-200">
            {currentColumns.map(header => (
              <th
                key={header}
                className="p-2.5 font-bold text-left tracking-wider uppercase text-[11px] text-slate-800 border-r border-slate-200 last:border-r-0 whitespace-nowrap"
              >
                {header}
              </th>
            ))}
            <th className="p-2.5 w-24 text-center tracking-wider uppercase text-[11px] text-slate-800 no-print">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {section.materials.map((material, rowIdx) => (
            <tr key={material.id} className="hover:bg-sky-50/40 transition-colors">
              {currentColumns.map(header => (
                <td key={`${material.id}-${header}`} className="p-1 sm:p-1.5 border-r border-slate-200 last:border-r-0">
                  <Input
                    className="text-xs h-8 border-transparent hover:border-slate-300 focus-visible:border-primary focus-visible:ring-1 bg-transparent rounded-md transition-all font-medium text-slate-800"
                    value={material[header] || ''}
                    placeholder={header.toLowerCase()}
                    onChange={e => handleMaterialChange(material.id, header, e.target.value)}
                  />
                </td>
              ))}
              <td className="p-1 sm:p-1.5 text-center no-print">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                    onClick={() => onOpenAiSuggestions(material)}
                    title="Gemini AI Material Suggestions"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteRow(material.id)}
                    title="Delete Row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
