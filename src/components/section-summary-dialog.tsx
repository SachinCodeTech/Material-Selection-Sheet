'use client';
import { useState, useEffect } from 'react';
import { Section } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateSectionSummary, type SectionSummaryOutput } from '@/ai/flows/section-summary-generator';
import { Loader2, FileText } from 'lucide-react';
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

  useEffect(() => {
    if (open && section) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setSummary(null);
        try {
          const result = await generateSectionSummary({
            sectionName: section.name,
            materialData: JSON.stringify(section.materials),
          });
          setSummary(result);
        } catch (error) {
          console.error('AI summary error:', error);
          toast({
            title: "AI Summary Failed",
            description: "Could not generate summary. Please try again.",
            variant: "destructive"
          })
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [open, section, toast]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
            <FileText /> Section Summary
          </DialogTitle>
          <DialogDescription>
            AI-generated summary for section: "{section.name}".
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="animate-spin size-8 text-primary" />
            <p className="mt-4 text-muted-foreground">Generating summary...</p>
          </div>
        )}
        
        {summary && !isLoading && (
          <div className="prose prose-sm max-w-none text-foreground py-4">
            <p>{summary.summary}</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
