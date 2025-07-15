
'use server';
/**
 * @fileOverview A flow for creating a content map from source documents to ICH E3 sections.
 *
 * - mapContentToSections - A function that handles the content mapping process.
 * - ContentMapInput - The input type for the mapContentToSections function.
 * - ContentMapOutput - The return type for the mapContentToSections function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import type { Section } from "@/data/ich-e3-sections";

const ContentMapInputSchema = z.object({
  sections: z.string().describe("A JSON string of the ICH E3 section structure (id, title, children)."),
  sourceText: z.string().describe("The combined text from all uploaded source documents."),
});
export type ContentMapInput = z.infer<typeof ContentMapInputSchema>;

const SectionContentPairSchema = z.object({
    sectionId: z.string().describe("The ID of the ICH E3 section (e.g., '9.1')."),
    relevantText: z.string().describe("A concatenation of all text snippets from the source document that are relevant to this section. If no relevant text is found, this should be an empty string."),
});

const ContentMapOutputSchema = z.object({
    contentMap: z.array(SectionContentPairSchema).describe("An array where each entry maps a section ID to the relevant text extracted from the source documents.")
});
export type ContentMapOutput = z.infer<typeof ContentMapOutputSchema>;


export async function mapContentToSections(
  input: ContentMapInput
): Promise<ContentMapOutput> {
  return mapContentToSectionsFlow(input);
}

const mapContentPrompt = ai.definePrompt({
  name: "mapContentToSectionsPrompt",
  input: { schema: ContentMapInputSchema },
  output: { schema: ContentMapOutputSchema },
  prompt: `
    You are an expert AI medical writing assistant. Your first and most critical task is to analyze a large body of text from clinical study source documents and map the relevant information to the appropriate sections of a Clinical Study Report (CSR), following the ICH E3 guidelines.

    **Instructions:**
    1.  **Analyze the Source:** You will be given a large body of text, which is a combination of multiple source documents. Read it carefully to understand the full context of the study.
    2.  **Analyze the CSR Structure:** You will also be given the JSON structure of the ICH E3 sections.
    3.  **Map Content to Sections:** For EACH section in the provided CSR structure, find all the relevant sentences, paragraphs, tables, and data points from the source text.
    4.  **Populate the Map:** Create a JSON array as the output. Each element in the array must be an object with two keys: "sectionId" and "relevantText".
    5.  **Be Comprehensive:** The "relevantText" for each section should be a single string containing ALL the information from the source text needed to draft that section.
    6.  **Handle Insufficient Information:** If the source document contains no relevant information for a particular section, the "relevantText" for that sectionId should be an empty string. DO NOT omit the section from the map. Every sectionId from the input must be present in the output map.

    **ICH E3 Section Structure:**
    ---
    {{{sections}}}
    ---

    **Source Document Text:**
    ---
    {{{sourceText}}}
    ---
  `,
});


const mapContentToSectionsFlow = ai.defineFlow(
  {
    name: "mapContentToSectionsFlow",
    inputSchema: ContentMapInputSchema,
    outputSchema: ContentMapOutputSchema,
  },
  async input => {
    // For very large documents, we might need to add chunking logic here in the future.
    // For now, we call the prompt directly.
    const {output} = await mapContentPrompt(input);
    return output!;
  }
);

    