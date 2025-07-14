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
  sectionId: z.string().describe('The ID of the CSR section to generate a draft for.'),
  localFileContent: z.string().describe('The content of the locally uploaded file.'),
});
export type GenerateCsrDraftInput = z.infer<typeof GenerateCsrDraftInputSchema>;

const GenerateCsrDraftOutputSchema = z.object({
  draftContent: z.string().describe('The AI-generated draft content for the specified CSR section.'),
});
export type GenerateCsrDraftOutput = z.infer<typeof GenerateCsrDraftOutputSchema>;

export async function generateCsrDraft(input: GenerateCsrDraftInput): Promise<GenerateCsrDraftOutput> {
  return generateCsrDraftFlow(input);
}

const generateCsrDraftPrompt = ai.definePrompt({
  name: 'generateCsrDraftPrompt',
  input: {schema: GenerateCsrDraftInputSchema},
  output: {schema: GenerateCsrDraftOutputSchema},
  prompt: `You are an expert medical writer specializing in drafting Clinical Study Reports (CSRs).

  You will be provided with the content of a locally uploaded document and the ID of a specific CSR section.
  Your task is to generate a draft for that section using the provided document content as context.
  The draft should be well-formatted and suitable for inclusion in a CSR.

  Section ID: {{{sectionId}}}
  Document Content: {{{localFileContent}}}

  Please generate the draft content for the specified CSR section.
  Make sure to include details and information from the document content.
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
