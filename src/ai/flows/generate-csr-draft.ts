
'use server';
/**
 * @fileOverview A flow for generating a single section of a Clinical Study Report.
 *
 * - generateCsrDraft - A function that handles the CSR section draft generation.
 * - CsrDraftInput - The input type for the generateCsrDraft function.
 * - CsrDraftOutput - The return type for the generateCsrDraft function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

const CsrDraftInputSchema = z.object({
  sectionId: z.string().describe("The ID of the ICH E3 section (e.g., '9.1')."),
  sectionTitle: z.string().describe("The title of the ICH E3 section (e.g., 'Overall Study Design and Plan - Description')."),
  sourceText: z.string().describe("The source document text to be used for drafting the section."),
});
export type CsrDraftInput = z.infer<typeof CsrDraftInputSchema>;

const CsrDraftOutputSchema = z.object({
  draft: z.string().describe("The AI-generated draft for the specified section, formatted in HTML."),
});
export type CsrDraftOutput = z.infer<typeof CsrDraftOutputSchema>;

export async function generateCsrDraft(
  input: CsrDraftInput
): Promise<CsrDraftOutput> {
  return generateCsrDraftFlow(input);
}

const generateCsrDraftPrompt = ai.definePrompt({
  name: "generateCsrDraftPrompt",
  input: { schema: CsrDraftInputSchema },
  output: { schema: CsrDraftOutputSchema },
  prompt: `
    You are an expert medical writer specializing in Clinical Study Reports (CSRs).
    Your task is to draft a specific section of a CSR based on the provided source document.
    Adhere strictly to the ICH E3 guidelines for the content and structure of the section.

    **Instructions:**
    1.  **Analyze the Source:** Carefully read the provided source document text. This text may be a combination of multiple documents.
    2.  **Identify Relevant Information:** Extract all information relevant to the specified CSR section.
    3.  **Draft the Section:** Write a comprehensive draft for the section using ONLY the extracted information. The output must be in well-formed HTML. Use appropriate tags like <p>, <ul>, <ol>, <li>, etc. Do not include <html>, <head>, or <body> tags. Crucially, DO NOT include the section heading itself in the output.
    4.  **Handle Insufficient Information:** If the source document does not contain any relevant information to draft the section, return a single HTML paragraph with the text: "<p>[Insufficient information in source documents to generate this section.]</p>"

    **CSR Section to Draft:**
    - **Section ID:** {{{sectionId}}}
    - **Section Title:** {{{sectionTitle}}}

    **Source Document Text:**
    ---
    {{{sourceText}}}
    ---
  `,
});


const generateCsrDraftFlow = ai.defineFlow(
  {
    name: "generateCsrDraftFlow",
    inputSchema: CsrDraftInputSchema,
    outputSchema: CsrDraftOutputSchema,
  },
  async input => {
    const {output} = await generateCsrDraftPrompt(input);
    return output!;
  }
);
