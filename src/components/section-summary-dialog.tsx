'use client';
import { useState, useEffect } from 'react';
import { Section } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateSectionSummary, type SectionSummaryOutput } from '@/ai/flows/section-summary-generator';
import { Loader2, FileText, CheckCircle2, Building2, MapPin, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SectionSummaryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: Section;
};

export function SectionSummaryDialog({ open, onOpenChange, section }: SectionSummaryDialogProps) {
  const [summary, setSummary] = useState<SectionSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Compute offline local metrics
  const totalRows = section.materials.length;
  const filledRows = section.materials.filter(m =>
    Object.values(m).some(val => val && val.toString().trim() !== '' && val !== m.id)
  ).length;

  const companies = Array.from(
    new Set(
      section.materials
        .map(m => m['COMPANY'] || m['Company'] || m['MANUFACTURER'] || '')
        .filter(Boolean)
    )
  );

  const utilityAreas = Array.from(
    new Set(
      section.materials
        .map(m => m['UTILITY AREA'] || m['Utility Area'] || m['LOCATION'] || '')
        .filter(Boolean)
    )
  );

  useEffect(() => {
    if (open && section) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setSummary(null);
        try {
          // Check if online first
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setSummary({
              summary: `Offline Architectural Summary: "${section.name}" contains ${filledRows} documented material specification(s) across ${utilityAreas.length > 0 ? utilityAreas.join(', ') : 'multiple utility areas'}. Sourced from ${companies.length > 0 ? companies.join(', ') : 'specified manufacturers'}.`,
            });
            setIsLoading(false);
            return;
          }

          const result = await generateSectionSummary({
            sectionName: section.name,
            materialData: JSON.stringify(section.materials),
          });
          setSummary(result);
        } catch (error) {
          console.warn('AI summary notice:', error);
          setSummary({
            summary: `Architectural Summary: "${section.name}" has ${filledRows} active material specification(s) recorded across ${section.columns?.length || 5} specification attributes.`,
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [open, section, filledRows, utilityAreas, companies]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-primary font-bold">
            <FileText className="h-5 w-5" /> Section Summary & Metrics
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Summary and specification statistics for "{section.name}".
          </DialogDescription>
        </DialogHeader>

        {/* Calculated Architectural Metrics (Always Available Offline & Online) */}
        <div className="grid grid-cols-3 gap-2.5 py-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
            <Layers className="h-4 w-4 mx-auto text-primary" />
            <div className="text-base font-bold text-slate-900">{filledRows} / {totalRows}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Entries</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
            <MapPin className="h-4 w-4 mx-auto text-primary" />
            <div className="text-base font-bold text-slate-900">{utilityAreas.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Utility Areas</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
            <Building2 className="h-4 w-4 mx-auto text-primary" />
            <div className="text-base font-bold text-slate-900">{companies.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Companies</div>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <p className="text-xs text-slate-500 font-medium">Analyzing architectural specifications...</p>
          </div>
        )}

        {summary && !isLoading && (
          <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
            <div className="font-bold text-primary flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Specification Overview:
            </div>
            <p className="whitespace-pre-line text-slate-800">{summary.summary}</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-primary text-white font-semibold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
