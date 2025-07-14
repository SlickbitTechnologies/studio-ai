'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating CSR section drafts from uploaded documents.
 *
 * - generateCsrDraft - A function that takes a section ID and local file content, generates a draft using AI, and returns the draft content.
 * - GenerateCsrDraftInput - The input type for the generateCsrDraft function.
 * - GenerateCsrDraftOutput - The return type for the generateCsrDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCsrDraftInputSchema = z.object({
  sectionId: z.string().describe('The ID and title of the CSR section to generate a draft for (e.g., "9.1 Overall Study Design and Plan - Description").'),
  localFileContent: z.string().describe('The content of the locally uploaded file(s), which serve as the source material.'),
});
export type GenerateCsrDraftInput = z.infer<typeof GenerateCsrDraftInputSchema>;

const GenerateCsrDraftOutputSchema = z.object({
  draftContent: z.string().describe('The AI-generated draft content for the specified CSR section, formatted in HTML.'),
});
export type GenerateCsrDraftOutput = z.infer<typeof GenerateCsrDraftOutputSchema>;

export async function generateCsrDraft(input: GenerateCsrDraftInput): Promise<GenerateCsrDraftOutput> {
  return generateCsrDraftFlow(input);
}

const generateCsrDraftPrompt = ai.definePrompt({
  name: 'generateCsrDraftPrompt',
  input: {schema: GenerateCsrDraftInputSchema},
  output: {schema: GenerateCsrDraftOutputSchema},
  prompt: `You are an expert medical writer specializing in drafting Clinical Study Reports (CSRs) based on the ICH E3 guidelines.

You will be provided with content from source documents and the specific CSR section to draft. Your task is to generate a well-written, clear, and comprehensive draft for that section ONLY.

**Instructions:**
1.  **Analyze Source Content:** Carefully read the provided document content to understand the clinical study.
2.  **Focus on the Target Section:** Use the information from the source documents to write a detailed draft for the specified section.
3.  **Output Format:** Your response MUST be the draft content itself, formatted in HTML (using paragraphs <p>, lists <ul>, etc. as needed). Do NOT include the section heading in your response.
4.  **Insufficient Information:** If you cannot find relevant information in the source documents to draft the section, your response must be the single sentence: *[Insufficient information in source documents to generate this section.]*

**Target Section:**
{{{sectionId}}}

**Source Document Content:**
---
{{{localFileContent}}}
---

Now, generate the HTML draft content for the target section.
`,
});

const generateCsrDraftFlow = ai.defineFlow(
  {
    name: 'generateCsrDraftFlow',
    inputSchema: GenerateCsrDraftInputSchema,
    outputSchema: GenerateCsrDraftOutputSchema,
  },
  async input => {
    const {output} = await generateCsrDraftPrompt(input);
    return output!;
  }
);
