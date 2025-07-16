
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
    You are an expert medical writer with extensive experience in drafting Clinical Study Reports (CSRs) that are compliant with ICH E3 guidelines. Your task is to produce a high-quality, detailed first draft of a CSR based *only* on the provided source documents.

    **Your Goal:** Create a comprehensive, well-structured, and professionally written CSR draft in a single HTML document.

    **Core Instructions:**

    1.  **Assume the Role:** Adopt a formal, scientific, and objective tone appropriate for a regulatory submission. Use precise medical and clinical trial terminology.

    2.  **Comprehensive Analysis:** Meticulously analyze the entirety of the **Full Source Document Text** provided below. Your primary task is to locate, synthesize, and intelligently map all relevant information to its corresponding section in the **Official ICH E3 Structure**. Be thorough and persistent in this mapping process.

    3.  **Detailed Drafting:**
        -   Generate a detailed and comprehensive draft for every possible section and subsection. Do not just list facts; build a clear narrative for each section, explaining the context and results as a human expert would.
        -   For sections that require synthesis or interpretation (e.g., Introduction, Discussion, Conclusions), you are expected to understand the overall context of the source documents and draft these sections intelligently.
        -   The output MUST be a single, well-formed HTML string.
        -   Begin the report with an '<h1>Clinical Study Report</h1>' tag.
        -   For each section and subsection, create a corresponding HTML heading with an ID (e.g., '<h2 id="section-9">9 INVESTIGATIONAL PLAN</h2>', '<h3 id="section-9.1">9.1 Overall Study Design and Plan - Description</h3>').
        -   Under each heading, write the body of the section using standard HTML tags like '<p>', '<ul>', '<li>', '<table>', etc. to structure the information clearly.

    4.  **Adherence to Source Material:** Your writing must be a synthesis of the information present in the source documents. Do not add information or make assumptions beyond what can be reasonably inferred from the provided text.

    5.  **Handle Missing Information (Absolute Last Resort):** Only if you have exhaustively searched the source documents and can find no explicit or inferential information for a specific, minor subsection should you include the text: '[Insufficient information in source documents to generate this section.]' within a '<p>' tag for that section. This should be a rare exception, not a common occurrence. Strive to populate every section.

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

