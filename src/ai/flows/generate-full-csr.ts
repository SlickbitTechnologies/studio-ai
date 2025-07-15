
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
    You are an expert medical writer specializing in Clinical Study Reports (CSRs), adhering strictly to ICH E3 guidelines.
    Your task is to create a complete, multi-section draft of a CSR based on the provided source documents and the official ICH E3 structure.

    **Instructions:**
    1.  **Analyze Source Documents:** You will be given the full text from all available source documents.
    2.  **Map Content to Structure:** Mentally map the information from the source documents to the appropriate sections of the ICH E3 structure provided below.
    3.  **Draft the Full Report:** Write a comprehensive draft for the entire CSR.
        - The output must be a single, well-formed HTML string.
        - Generate content for every section listed in the structure.
        - Use appropriate heading tags (e.g., <h2>, <h3>) for each section title, including the section ID (e.g., <h2 id="section-9">9 INVESTIGATIONAL PLAN</h2>).
        - For each section's content, use appropriate HTML tags like <p>, <ul>, <ol>, <li>, <table>, etc.
    4.  **Handle Insufficient Information:** If the source documents do not contain any relevant information for a specific section, state this clearly within that section's content, for example: "<p>[Insufficient information in source documents to generate this section.]</p>". Do not skip the section.
    5.  **Start with a Title:** Begin the document with <h1>Clinical Study Report</h1>.

    **Official ICH E3 Structure to Follow:**
    ---
${ichE3StructureString}
    ---

    **Full Source Document Text:**
    ---
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

    