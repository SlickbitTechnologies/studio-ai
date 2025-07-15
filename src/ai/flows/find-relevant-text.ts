
'use server';
/**
 * @fileOverview A flow for finding text relevant to a specific CSR section from a large source document.
 *
 * - findRelevantTextForSection - A function that handles the text extraction.
 * - RelevantTextForSectionInput - The input type for the function.
 * - RelevantTextForSectionOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

const RelevantTextForSectionInputSchema = z.object({
  sectionId: z.string().describe("The ID of the ICH E3 section (e.g., '9.1')."),
  sectionTitle: z.string().describe("The title of the ICH E3 section (e.g., 'Overall Study Design and Plan - Description')."),
  sourceText: z.string().describe("The full source document text to be analyzed."),
});
export type RelevantTextForSectionInput = z.infer<typeof RelevantTextForSectionInputSchema>;

const RelevantTextForSectionOutputSchema = z.object({
  relevantText: z.string().describe("A concatenation of all text snippets from the source document that are relevant to the specified section. If no relevant text is found, this should be an empty string."),
});
export type RelevantTextForSectionOutput = z.infer<typeof RelevantTextForSectionOutputSchema>;

export async function findRelevantTextForSection(
  input: RelevantTextForSectionInput
): Promise<RelevantTextForSectionOutput> {
  return findRelevantTextFlow(input);
}

const findRelevantTextPrompt = ai.definePrompt({
  name: "findRelevantTextPrompt",
  input: { schema: RelevantTextForSectionInputSchema },
  output: { schema: RelevantTextForSectionOutputSchema },
  prompt: `
    You are an AI assistant for medical writers. Your task is to act as a pre-processor.
    You will be given a large body of source text from one or more clinical study documents and a specific section of a Clinical Study Report (CSR).
    Your goal is to carefully read through all the source text and extract ONLY the sentences, paragraphs, or data points that are directly relevant to the specified CSR section.

    **Instructions:**
    1.  **Analyze the Target Section:** Understand the purpose and expected content of the target CSR section.
    2.  **Scan Source Document:** Read the entire source document text.
    3.  **Extract Relevant Snippets:** Identify and pull out all pieces of text that would be necessary to write the target CSR section.
    4.  **Concatenate and Return:** Combine all the extracted snippets into a single string. This will be used as the context for another AI to draft the section.
    5.  **Handle No Information:** If you cannot find any relevant information for the section in the source text, return an empty string for the 'relevantText' field.

    **Target CSR Section:**
    - **Section ID:** {{{sectionId}}}
    - **Section Title:** {{{sectionTitle}}}

    **Source Document Text:**
    ---
    {{{sourceText}}}
    ---
  `,
});


const findRelevantTextFlow = ai.defineFlow(
  {
    name: "findRelevantTextFlow",
    inputSchema: RelevantTextForSectionInputSchema,
    outputSchema: RelevantTextForSectionOutputSchema,
  },
  async input => {
    const {output} = await findRelevantTextPrompt(input);
    return output!;
  }
);

    