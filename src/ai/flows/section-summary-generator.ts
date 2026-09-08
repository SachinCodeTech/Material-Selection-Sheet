'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of a section based on the materials and specifications entered by the user.
 *
 * - generateSectionSummary -  A function that takes material data as input and returns a summary of the section.
 * - SectionSummaryInput - The input type for the generateSectionSummary function, which includes the section name and material data.
 * - SectionSummaryOutput - The output type for the generateSectionSummary function, which includes the summary of the section.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SectionSummaryInputSchema = z.object({
  sectionName: z.string().describe('The name of the section.'),
  materialData: z.string().describe('JSON string of the materials and specifications entered for the section.'),
});
export type SectionSummaryInput = z.infer<typeof SectionSummaryInputSchema>;

const SectionSummaryOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the section, highlighting key materials and specifications.'),
});
export type SectionSummaryOutput = z.infer<typeof SectionSummaryOutputSchema>;

export async function generateSectionSummary(input: SectionSummaryInput): Promise<SectionSummaryOutput> {
  return sectionSummaryGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sectionSummaryPrompt',
  input: {schema: SectionSummaryInputSchema},
  output: {schema: SectionSummaryOutputSchema},
  prompt: `You are an expert architectural assistant.  Your job is to summarize a section of an architectural specification sheet.

  The section name is: {{{sectionName}}}
  The material data is: {{{materialData}}}

  Please provide a concise summary of the section, highlighting key materials, specifications, and any potential inconsistencies.
`,
});

const sectionSummaryGeneratorFlow = ai.defineFlow(
  {
    name: 'sectionSummaryGeneratorFlow',
    inputSchema: SectionSummaryInputSchema,
    outputSchema: SectionSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
