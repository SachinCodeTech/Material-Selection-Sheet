'use client';
import { useState, useEffect } from 'react';
import { Material } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { suggestMaterials, type MaterialSuggestionsOutput } from '@/ai/flows/material-ai-suggestions';
import { Loader2, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type AiSuggestionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material;
  onApply: (suggestions: { suggestedSpecifications: string[] }) => void;
};

export function AiSuggestionsDialog({ open, onOpenChange, material, onApply }: AiSuggestionsDialogProps) {
  const [suggestions, setSuggestions] = useState<MaterialSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && material && material['MODEL NAME']) {
      const fetchSuggestions = async () => {
        setIsLoading(true);
        setSuggestions(null);
        setSelectedSpecs([]);
        try {
          const result = await suggestMaterials({
            materialDescription: material['MODEL NAME'],
            currentSpecifications: material['SURFACE AREA'],
          });
          setSuggestions(result);
        } catch (error) {
          console.error('AI suggestion error:', error);
          toast({
            title: "AI Suggestion Failed",
            description: "Could not fetch suggestions. Please try again.",
            variant: "destructive"
          })
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    }
  }, [open, material, toast]);
  
  const handleApply = () => {
    onApply({
        suggestedSpecifications: selectedSpecs
    });
    toast({
        title: "Specifications Applied",
        description: `${selectedSpecs.length} new specification(s) added to the material.`,
    })
    onOpenChange(false);
  };
  
  const toggleSpecSelection = (spec: string) => {
    setSelectedSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
            <Wand2 /> AI Suggestions
          </DialogTitle>
          <DialogDescription>
            AI-powered ideas for "{material['MODEL NAME'] || 'this material'}". Click specifications to select them for use.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="animate-spin size-8 text-primary" />
            <p className="mt-4 text-muted-foreground">Generating ideas...</p>
          </div>
        )}
        
        {suggestions && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
             <Card>
                <CardHeader className="pb-4"><CardTitle className="text-base text-primary">Related Materials</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {suggestions.suggestedMaterials.map((mat) => (
                        <Badge key={mat} variant="secondary">{mat}</Badge>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-4"><CardTitle className="text-base text-primary">Suggested Specifications</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {suggestions.suggestedSpecifications.map((spec) => (
                        <Badge key={spec} onClick={() => toggleSpecSelection(spec)} variant={selectedSpecs.includes(spec) ? "default" : "outline"} className="cursor-pointer transition-colors">
                            {spec}
                        </Badge>
                    ))}
                </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={isLoading || selectedSpecs.length === 0}>
            Apply {selectedSpecs.length > 0 ? `(${selectedSpecs.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
