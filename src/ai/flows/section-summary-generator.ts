'use server';

import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

export type SectionSummaryInput = {
  sectionName: string;
  materialData: string;
};

export type SectionSummaryOutput = {
  summary: string;
};

export async function generateSectionSummary(
  input: SectionSummaryInput
): Promise<SectionSummaryOutput> {
  if (!apiKey) {
    return {
      summary: `Summary for "${input.sectionName}": Contains specified material entries with dimensions, utility areas, model details, and company specifications.`,
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const promptText = `You are an expert architectural assistant. Your job is to summarize a section of an architectural specification sheet.

Section Name: ${input.sectionName}
Material Data: ${input.materialData}

Please provide a concise summary of the section, highlighting key materials, specifications, and any potential inconsistencies.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A brief summary of the section, highlighting key materials and specifications.',
            },
          },
          required: ['summary'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (parsed.summary) {
        return { summary: parsed.summary };
      }
    }
  } catch (error) {
    console.error('Error generating section summary:', error);
  }

  return {
    summary: `Summary for "${input.sectionName}": Contains specified material entries with dimensions, utility areas, model details, and company specifications.`,
  };
}
