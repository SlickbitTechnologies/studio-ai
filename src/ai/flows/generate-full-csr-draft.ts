'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a full CSR draft from uploaded documents.
 *
 * - generateFullCsrDraft - A function that takes file content and generates a complete CSR draft.
 * - GenerateFullCsrDraftInput - The input type for the function.
 * - GenerateFullCsrDraftOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ichE3Sections, type Section} from '@/data/ich-e3-sections';

const GenerateFullCsrDraftInputSchema = z.object({
  documentContents: z.string().describe('The combined content of all uploaded source documents.'),
});
export type GenerateFullCsrDraftInput = z.infer<typeof GenerateFullCsrDraftInputSchema>;

const GenerateFullCsrDraftOutputSchema = z.object({
  fullDraft: z.string().describe('The AI-generated full CSR draft in HTML format.'),
});
export type GenerateFullCsrDraftOutput = z.infer<typeof GenerateFullCsrDraftOutputSchema>;


function getSectionsList(sections: Section[], level: number): string {
    return sections.map(section => {
        const heading = `<h${level} id="section-${section.id}">${section.id} ${section.title}</h${level}>`;
        const children = section.children ? getSectionsList(section.children, level + 1) : '';
        return `${heading}\n${children}`;
    }).join('\n');
}

const ichE3Structure = getSectionsList(ichE3Sections, 1);


export async function generateFullCsrDraft(input: GenerateFullCsrDraftInput): Promise<GenerateFullCsrDraftOutput> {
  return generateFullCsrDraftFlow(input);
}

const generateFullCsrDraftPrompt = ai.definePrompt({
  name: 'generateFullCsrDraftPrompt',
  input: {schema: GenerateFullCsrDraftInputSchema},
  output: {schema: GenerateFullCsrDraftOutputSchema},
  prompt: `You are an expert medical writer tasked with creating a comprehensive first draft of a Clinical Study Report (CSR).
  Your response must be a single, well-formatted HTML document.

  You will be given content from various source documents. Your job is to analyze this content and populate the sections of the CSR based on the internationally recognized ICH E3 structure.

  **Instructions:**
  1.  **Analyze Source Content:** Carefully read the provided document content to understand the clinical study.
  2.  **Draft Each Section:** For each section and subsection in the ICH E3 structure provided below, write a draft using information from the source documents.
  3.  **HTML Formatting:** Structure your entire output as a single HTML document. Use heading tags (<h1>, <h2>, etc.) for each section title. The heading element for each section MUST have an 'id' attribute formatted as 'section-X.Y.Z'. For example, section 9.1 should have an element like '<h2 id="section-9.1">9.1 Overall Study Design and Plan - Description</h2>'.
  4.  **Handle Insufficient Information:** If you cannot find relevant information in the source documents to draft a particular section, YOU MUST explicitly state it. For that section, add the following text in italics: *[Insufficient information in source documents to generate this section.]* Do not leave any section completely blank.
  5.  **Be Comprehensive:** Populate as many sections as possible with relevant data, summaries, and text extracted or synthesized from the source documents.

  **ICH E3 Structure to Follow:**
  \`\`\`html
  {{{ichE3Structure}}}
  \`\`\`

  **Source Document Content:**
  ---
  {{{documentContents}}}
  ---

  Now, generate the full CSR draft as a single HTML document.
`,
  custom: {
    ichE3Structure: ichE3Structure,
  }
});

const generateFullCsrDraftFlow = ai.defineFlow(
  {
    name: 'generateFullCsrDraftFlow',
    inputSchema: GenerateFullCsrDraftInputSchema,
    outputSchema: GenerateFullCsrDraftOutputSchema,
  },
  async input => {
    const {output} = await generateFullCsrDraftPrompt(input);
    return { fullDraft: output!.fullDraft };
  }
);
