'use server';

/**
 * @fileOverview An AI agent that suggests related materials and specifications based on user inputs.
 *
 * - suggestMaterials - A function that handles the material suggestion process.
 * - MaterialSuggestionsInput - The input type for the suggestMaterials function.
 * - MaterialSuggestionsOutput - The return type for the suggestMaterials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MaterialSuggestionsInputSchema = z.object({
  materialDescription: z
    .string()
    .describe(
      'A description of the material for which suggestions are needed.'
    ),
  currentSpecifications: z
    .string()
    .optional()
    .describe(
      'The current specifications provided by the user, if any.  This provides context for better suggestions.'
    ),
});
export type MaterialSuggestionsInput = z.infer<typeof MaterialSuggestionsInputSchema>;

const MaterialSuggestionsOutputSchema = z.object({
  suggestedMaterials: z
    .array(z.string())
    .describe('A list of suggested related materials.'),
  suggestedSpecifications: z
    .array(z.string())
    .describe('A list of suggested specifications for the material.'),
});
export type MaterialSuggestionsOutput = z.infer<typeof MaterialSuggestionsOutputSchema>;

export async function suggestMaterials(
  input: MaterialSuggestionsInput
): Promise<MaterialSuggestionsOutput> {
  return suggestMaterialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'materialSuggestionsPrompt',
  input: {schema: MaterialSuggestionsInputSchema},
  output: {schema: MaterialSuggestionsOutputSchema},
  prompt: `You are an AI assistant that suggests related materials and specifications for architectural projects.

  Based on the user's description of a material and any existing specifications they have provided, suggest related materials and specifications that are commonly used in architectural practices.

  Material Description: {{{materialDescription}}}
  Current Specifications: {{{currentSpecifications}}}

  Ensure the suggestions are practical and compatible with common architectural practices.`,
});

const suggestMaterialsFlow = ai.defineFlow(
  {
    name: 'suggestMaterialsFlow',
    inputSchema: MaterialSuggestionsInputSchema,
    outputSchema: MaterialSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
