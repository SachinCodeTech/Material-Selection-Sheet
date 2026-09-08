'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Project, Section, Material } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, File, Share2, Loader2, Wand2, Folder, X, FileText, Power, Trash2 } from 'lucide-react';
import { AiSuggestionsDialog } from '@/components/ai-suggestions-dialog';
import { SectionSummaryDialog } from '@/components/section-summary-dialog';
import html2pdf from 'html2pdf.js';

export default function ProjectPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useLocalStorage<string | null>('currentUser', null);

  const [aiMaterial, setAiMaterial] = useState<Material | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [summarySection, setSummarySection] = useState<Section | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);


  useEffect(() => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
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

  const handleAddSection = () => {
    if (currentProject) {
      const newSection: Section = {
        id: crypto.randomUUID(),
        name: `New Section ${currentProject.sections.length + 1}`,
        materials: Array.from({ length: 4 }, () => ({
            id: crypto.randomUUID(),
            'UTILITY AREA': '',
            'SURFACE AREA': '',
            'SIZE (MM)': '',
            'MODEL NAME': '',
            'COMPANY': ''
        })),
      };
      const updatedSections = [...currentProject.sections, newSection];
      updateCurrentProject('sections', updatedSections);
    }
  };

  const handleSaveSheet = () => {
    if (currentProject) {
      setIsLoading(true);
      setProjects(prev => prev.map(p => p.id === currentProject.id ? currentProject : p));
      setTimeout(() => {
        setIsLoading(false);
        toast({ title: 'Project Saved Successfully!' });
      }, 500);
    }
  };

  const exportPDF = () => {
    if (!currentProject) return;

    toast({ title: "Generating PDF..." });

    // Dynamically generate the HTML content for the PDF based on project data
    const sectionsHtml = currentProject.sections.map(section => `
      <div class="section">
        <div class="section-title">${section.name}</div>
        <table>
          <thead>
            <tr>
              <th>UTILITY AREA</th>
              <th>SURFACE AREA</th>
              <th>SIZE (MM)</th>
              <th>MODEL NAME</th>
              <th>COMPANY</th>
            </tr>
          </thead>
          <tbody>
            ${section.materials.map(material => `
              <tr>
                <td>${material['UTILITY AREA']}</td>
                <td>${material['SURFACE AREA']}</td>
                <td>${material['SIZE (MM)']}</td>
                <td>${material['MODEL NAME']}</td>
                <td>${material['COMPANY']}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    const pdfContent = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body { font-family: 'Inter', sans-serif; font-size: 8pt; color: #333; }
            .pdf-container { width: 100%; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 14pt; color: #045E7D; margin: 0; }
            .header p { font-size: 9pt; color: #555; margin: 5px 0 0 0; }
            .project-info { display: flex; justify-content: space-between; margin: 20px 0; font-size: 10pt; font-weight: bold; }
            .section { margin-bottom: 15px; page-break-inside: avoid; }
            .section-title { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 7pt; word-break: break-word; }
            th { background-color: #f2f2f2; font-weight: bold; color: #333; }
            .footer { text-align: center; font-size: 9pt; color: #666; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; }
            
            /* Aggressive print styles from print.css */
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              th.no-print, td.no-print {
                display: none !important;
              }
              input {
                border: none !important;
                background: transparent !important;
                box-shadow: none !important;
                outline: none !important;
                color: inherit !important;
                font-family: inherit !important;
                font-size: inherit !important;
                padding: 0 !important;
              }
              .header {
                border-bottom: 1px solid #ccc !important;
              }
              th {
                background-color: #f2f2f2 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <div class="header">
              <h1>MATERIAL SELECTION SHEET</h1>
              <p>${currentProject.companyName}</p>
            </div>
            <div class="project-info">
              <div>Project: ${currentProject.name}</div>
              <div>Date: ${currentProject.date}</div>
            </div>
            ${sectionsHtml}
            <div class="footer">MSS-v.1.0 | CodeTech | by Sachin's</div>
          </div>
        </body>
      </html>
    `;

    const opt = {
      margin:       [15, 10, 15, 10], // top, left, bottom, right in mm
      filename:     `${currentProject.name || 'material-sheet'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
  }
  
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

  if (!currentProject) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </main>
    );
  }

  return (
    <>
      <main id="pdfArea" className="min-h-screen bg-card p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-4 bg-gray-50 p-5 rounded-t-lg no-print">
          <h1 className="text-xl font-bold text-primary">MATERIAL SELECTION SHEET</h1>
          <Input 
            value={currentProject.companyName}
            onChange={e => updateCurrentProject('companyName', e.target.value)}
            className="text-md text-muted-foreground text-center border-0 focus-visible:ring-1 mt-1 bg-transparent"
            placeholder="Your Company Name"
          />
          <p className="text-sm mt-3">ID: <span className="font-semibold">{currentUser}</span></p>
        </header>
        <hr className="no-print" />
        <div className="flex justify-between items-center my-4 flex-wrap gap-4 no-print">
            <div className="flex items-center gap-2 flex-grow">
                <Label htmlFor="projectName" className="font-semibold text-primary">Project:</Label>
                <Input id="projectName" value={currentProject.name} onChange={e => updateCurrentProject('name', e.target.value)} className="font-bold text-base" placeholder="Project Name" />
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="projectDate" className="font-semibold text-primary">Date:</Label>
                <Input id="projectDate" type="date" value={currentProject.date} onChange={e => updateCurrentProject('date', e.target.value)} className="" />
            </div>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap justify-center no-print">
          <Button size="sm" onClick={handleAddSection}><Plus /> New Section</Button>
          <Button size="sm" onClick={handleSaveSheet} disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
          <Button size="sm" onClick={exportPDF}><File /> Export PDF</Button>
          <Button size="sm" onClick={sharePage}><Share2 /> Share</Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/projects')}><Folder /> Projects</Button>
          <Button size="sm" variant="destructive" onClick={() => router.push('/')}><Power /> Exit</Button>
        </div>

        <div id="sections">
          {currentProject.sections.map(section => (
            <div key={section.id} className="mb-6 bg-white rounded-lg printable-section">
              <div className="flex items-center justify-between font-bold text-lg text-primary bg-gray-50 p-2 rounded-t-lg">
                <Input
                  value={section.name}
                  onChange={e => updateSection({ ...section, name: e.target.value })}
                  className="font-bold text-lg border-0 focus-visible:ring-1 bg-transparent h-auto p-1"
                />
                <div className="flex items-center no-print">
                    <Button variant="ghost" size="icon" className="text-primary h-8 w-8" onClick={() => openSummary(section)} title="Generate Summary">
                        <FileText size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteSection(section.id)} title="Delete Section">
                        <X size={16} />
                    </Button>
                </div>
              </div>
              <div className="p-2">
                <MaterialTableComponent section={section} onUpdateSection={updateSection} onOpenAiSuggestions={openAiSuggestions} />
              </div>
            </div>
          ))}
        </div>
      </main>
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
    </>
  );
}

const MaterialTableComponent = ({ section, onUpdateSection, onOpenAiSuggestions }: { section: Section; onUpdateSection: (section: Section) => void; onOpenAiSuggestions: (material: Material) => void; }) => {

  const handleMaterialChange = (materialId: string, field: keyof Material, value: string) => {
    const updatedMaterials = section.materials.map(m =>
      m.id === materialId ? { ...m, [field]: value } : m
    );
    onUpdateSection({ ...section, materials: updatedMaterials });
  };

  const addRow = () => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      'UTILITY AREA': '',
      'SURFACE AREA': '',
      'SIZE (MM)': '',
      'MODEL NAME': '',
      'COMPANY': ''
    };
    onUpdateSection({ ...section, materials: [...section.materials, newMaterial] });
  };

  const deleteRow = (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
        const updatedMaterials = section.materials.filter(m => m.id !== materialId);
        onUpdateSection({ ...section, materials: updatedMaterials });
    }
  };

  const headers: (keyof Material)[] = ["UTILITY AREA", "SURFACE AREA", "SIZE (MM)", "MODEL NAME", "COMPANY"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            {headers.map(header => <th key={header} className="border p-2 font-bold text-left text-primary">{header}</th>)}
            <th className="border p-2 w-28 text-center text-primary no-print">Actions</th>
          </tr>
        </thead>
        <tbody>
          {section.materials.map(material => (
            <tr key={material.id}>
              {headers.map(header => (
                <td key={`${material.id}-${header}`} className="border p-1">
                  <Input
                    className="text-xs h-auto border-none focus-visible:ring-1 bg-transparent rounded-none"
                    value={material[header]}
                    onChange={e => handleMaterialChange(material.id, header, e.target.value)}
                  />
                </td>
              ))}
              <td className="border p-1 text-center no-print">
                 <Button variant="ghost" size="icon" className="size-6 text-primary" onClick={() => onOpenAiSuggestions(material)} title="AI Suggestions">
                    <Wand2 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => deleteRow(material.id)} title="Delete Row">
                  <Trash2 className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="outline" size="sm" onClick={addRow} className="mt-2 no-print">
        <Plus className="mr-2" /> Add Row
      </Button>
    </div>
  )
}
