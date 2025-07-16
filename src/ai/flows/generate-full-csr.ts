
'use server';
/**
 * @fileOverview A flow for generating an entire Clinical Study Report in a single call.
 *
 * - generateFullCsr - A function that handles the full CSR draft generation.
 * - FullCsrInput - The input type for the generateFullCsr function.
 * - FullCsrOutput - The return type for the generateFullCsr function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { ichE3Sections } from "@/data/ich-e3-sections";

// Helper function to format the sections list for the prompt
const formatSectionsForPrompt = (sections: any[], level = 0): string => {
  return sections.map(section => {
      const indent = '  '.repeat(level);
      let str = `${indent}- Section ${section.id}: ${section.title}\n`;
      if (section.children) {
          str += formatSectionsForPrompt(section.children, level + 1);
      }
      return str;
  }).join('');
};

const ichE3StructureString = formatSectionsForPrompt(ichE3Sections);

const FullCsrInputSchema = z.object({
  sourceText: z.string().describe("The full context from all available source documents."),
});
export type FullCsrInput = z.infer<typeof FullCsrInputSchema>;

const FullCsrOutputSchema = z.object({
  fullDraft: z.string().describe("The AI-generated full draft for the CSR, formatted in well-structured HTML."),
});
export type FullCsrOutput = z.infer<typeof FullCsrOutputSchema>;


export async function generateFullCsr(
  input: FullCsrInput
): Promise<FullCsrOutput> {
  return generateFullCsrFlow(input);
}


const generateFullCsrPrompt = ai.definePrompt({
  name: "generateFullCsrPrompt",
  input: { schema: FullCsrInputSchema },
  output: { schema: FullCsrOutputSchema },
  prompt: `
    You are an expert medical writer tasked with drafting a Clinical Study Report (CSR) based *only* on the provided source documents. Your work must strictly adhere to the ICH E3 guidelines.

    **Your Goal:** Create a complete, well-structured CSR draft in HTML format.

    **Core Instructions:**

    1.  **Analyze and Map:** Your primary task is to carefully read the **Full Source Document Text** provided below. For each section in the **Official ICH E3 Structure**, you must find the relevant information within the source text.
    2.  **Draft the Report:** Generate a comprehensive draft for the entire CSR.
        -   The output MUST be a single, well-formed HTML string.
        -   Begin the report with an \`<h1>Clinical Study Report</h1>\` tag.
        -   For each section and subsection, create a corresponding HTML heading with an ID (e.g., \`<h2 id="section-9">9 INVESTIGATIONAL PLAN</h2>\`, \`<h3 id="section-9.1">9.1 Overall Study Design and Plan - Description</h3>\`).
        -   Under each heading, write the body of the section using the information you found in the source documents. Use standard HTML tags like \`<p>\`, \`<ul>\`, \`<li>\`, \`<table>\`, etc.
    3.  **Synthesize, Don't Invent:** Your writing should be a synthesis of the information present in the source documents. Do not add information or make assumptions beyond what is provided.
    4.  **Handle Missing Information (Last Resort):** Only if you have exhaustively searched the source documents and found absolutely no relevant information for a specific section should you include the text: \`[Insufficient information in source documents to generate this section.]\` within a \`<p>\` tag for that section. Do not use this as a default. It is crucial that you make every effort to populate each section from the provided text.

    ---
    **Official ICH E3 Structure to Follow:**
    ${ichE3StructureString}
    ---

    ---
    **Full Source Document Text:**
    {{{sourceText}}}
    ---
  `,
});


const generateFullCsrFlow = ai.defineFlow(
  {
    name: "generateFullCsrFlow",
    inputSchema: FullCsrInputSchema,
    outputSchema: FullCsrOutputSchema,
  },
  async input => {
    const {output} = await generateFullCsrPrompt(input);
    return output!;
  }
);

