'use server';

import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

export type MaterialSuggestionsInput = {
  materialDescription: string;
  currentSpecifications?: string;
};

export type MaterialSuggestionsOutput = {
  suggestedMaterials: string[];
  suggestedSpecifications: string[];
};

export async function suggestMaterials(
  input: MaterialSuggestionsInput
): Promise<MaterialSuggestionsOutput> {
  if (!apiKey) {
    return {
      suggestedMaterials: ['Granite Finish', 'Polished Quartz', 'Italian Marble', 'Ceramic Tile'],
      suggestedSpecifications: ['Water resistant', 'Scratch resistant', 'Anti-skid surface', 'High durability'],
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const promptText = `You are an AI assistant that suggests related materials and specifications for architectural projects.

Based on the user's description of a material and any existing specifications provided, suggest related materials and specifications commonly used in architectural practices.

Material Description: ${input.materialDescription}
Current Specifications: ${input.currentSpecifications || 'None'}

Ensure suggestions are practical and compatible with architectural standards.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedMaterials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of suggested related materials.',
            },
            suggestedSpecifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of suggested specifications for the material.',
            },
          },
          required: ['suggestedMaterials', 'suggestedSpecifications'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        suggestedMaterials: Array.isArray(parsed.suggestedMaterials) ? parsed.suggestedMaterials : [],
        suggestedSpecifications: Array.isArray(parsed.suggestedSpecifications) ? parsed.suggestedSpecifications : [],
      };
    }
  } catch (error) {
    console.error('Error generating material suggestions:', error);
  }

  return {
    suggestedMaterials: ['Granite Finish', 'Polished Quartz', 'Italian Marble', 'Ceramic Tile'],
    suggestedSpecifications: ['Water resistant', 'Scratch resistant', 'Anti-skid surface', 'High durability'],
  };
}
