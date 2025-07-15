
'use server';
/**
 * @fileOverview An AI flow for analyzing source documents and mapping relevant text to ICH E3 sections.
 *
 * - mapContentToSections - A function that orchestrates the content mapping process.
 * - ContentMappingInput - The input type for the mapping function.
 * - ContentMappingOutput - The return type for the mapping function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

// Defines the structure for each section's mapping
const SectionMappingSchema = z.object({
  sectionId: z.string().describe("The ID of the ICH E3 section (e.g., '9.1')."),
  sectionTitle: z.string().describe("The title of the ICH E3 section."),
  relevantText: z.string().describe("A concise aggregation of all text fragments from the source documents that are relevant to this specific section. If no relevant text is found, this should be an empty string."),
});

// Defines the input schema for the flow
const ContentMappingInputSchema = z.object({
  sourceText: z.string().describe("The complete, combined text from all uploaded source documents."),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
    })
  ).describe("An array of all ICH E3 sections that need to be mapped."),
});
export type ContentMappingInput = z.infer<typeof ContentMappingInputSchema>;


// Defines the output schema for the flow
const ContentMappingOutputSchema = z.object({
  sectionMappings: z.array(SectionMappingSchema).describe("An array of content mappings, one for each ICH E3 section."),
});
export type ContentMappingOutput = z.infer<typeof ContentMappingOutputSchema>;

// The main exported function that will be called from the frontend
export async function mapContentToSections(
  input: ContentMappingInput
): Promise<ContentMappingOutput> {
  return mapContentFlow(input);
}


const mapContentPrompt = ai.definePrompt({
  name: "mapContentPrompt",
  input: { schema: ContentMappingInputSchema },
  output: { schema: ContentMappingOutputSchema },
  prompt: `
    You are an expert medical writer and data analyst. Your task is to analyze a collection of source documents
    and systematically map relevant information to the corresponding sections of an ICH E3 Clinical Study Report (CSR).

    **Instructions:**
    1.  **Review All Sections:** Carefully examine the provided list of all ICH E3 section IDs and titles.
    2.  **Analyze Source Text:** Thoroughly read the entire body of the provided source document text.
    3.  **Map Content:** For EACH section in the provided list, identify and extract ALL text fragments from the source
        document that are relevant for drafting that specific section.
    4.  **Aggregate Text:** Combine the extracted fragments for each section into a single 'relevantText' string.
    5.  **Handle Missing Information:** If you find NO relevant information for a particular section in the source text, you MUST return an empty string "" for its 'relevantText' field. Do not invent information or add placeholders.
    6.  **Format Output:** Return the result as a structured JSON object containing an array of section mappings.

    **ICH E3 Sections to Map:**
    {{#each sections}}
    - {{id}}: {{title}}
    {{/each}}

    **Source Document Text:**
    ---
    {{{sourceText}}}
    ---
  `,
});


const mapContentFlow = ai.defineFlow(
  {
    name: "mapContentFlow",
    inputSchema: ContentMappingInputSchema,
    outputSchema: ContentMappingOutputSchema,
  },
  async input => {
    // For very large documents, we might need to add chunking logic here in the future.
    // For now, we call the prompt directly.
    const {output} = await mapContentPrompt(input);
    return output!;
  }
);
