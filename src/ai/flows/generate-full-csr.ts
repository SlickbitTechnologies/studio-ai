
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

    **Your Goal:** Create a comprehensive, well-structured, and professionally written CSR draft in a single HTML document by intelligently analyzing and mapping the provided source documents to the required CSR sections.

    **Core Instructions - Follow this process meticulously:**

    **Step 1: Document Ingestion & Categorization**
    - Ingest all uploaded source documents provided in the **Full Source Document Text** section below. These may include protocols, statistical analysis plans (SAPs), clinical reviews, summary tables, regulatory reports, pharmacology reports, etc.
    - Mentally categorize each document by its functional content (e.g., protocol/design, statistical methods, safety, efficacy, pharmacology, product quality, regulatory, appendices).

    **Step 2: Section Mapping & Content Extraction**
    - For each section in the **Official ICH E3 Structure**, identify the best-suited source(s) among the uploaded documents.
    - Use flexible, dynamic mapping logic. Your primary goal is to maximize informativeness and precision for each CSR section based on the *strongest available evidence* in the documents.
    - Avoid redundant extraction. If multiple documents contain similar information, synthesize and integrate it, prioritizing the most detailed or authoritative source.

    **Step 3: Detailed Drafting with Section-Specific Guidance**
    - Generate a detailed and comprehensive draft for every possible section and subsection. Do not just list facts; build a clear narrative for each section, explaining the context and results as a human expert would.
    - Use the following table as your guide for prioritizing sources and extracting content. This is a guide, not a rigid rule; adapt based on the actual documents provided.

| CSR Section              | Typical Source(s) to Prioritize        | Extraction Guidance                                                                  |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------ |
| Synopsis/Introduction    | Protocol, Clinical Review, IB, Regulatory | Pull study rationale, objectives, background, and summary findings.                  |
| Methods                  | Protocol, SAP, Clinical/Statistical Review | Extract design, populations, eligibility, interventions, endpoints, analysis methods. |
| Statistical Methods      | SAP, Clinical/Statistical Review, Protocol | Use SAP if present; otherwise, derive analytic detail from reviews or protocol.    |
| Efficacy Results         | TLFs, Medical/Statistical Review, Protocol | Use data tables/listings if possible, else use summary stats/excerpts from reviews.  |
| Safety Results           | TLFs, Medical Review, Clinical Review  | Prefer full listings/tables; otherwise, extract event summaries from reviews.       |
| Pharmacokinetics         | Clinical Pharmacology Review           | Extract PK/PD tables, models, and descriptive text.                                  |
| Product Quality/CMC      | CMC Review, Chemistry Report           | Synthesize quality, manufacturing, and control sections.                             |
| Discussion/Conclusions   | Clinical Review, Regulatory Summary    | Integrate efficacy/safety discussions and benefit-risk conclusions.                   |
| Appendices               | Any reports, subject listings, data    | Include supplementary tables, subject narratives, facility/inspection data as present. |

    **Step 4: Handle Missing Information & Final Output**
    - Your writing must be a synthesis of information present in the source documents. Do not add information or make assumptions beyond what can be reasonably inferred.
    - **Crucially:** If a specific CSR section lacks direct source material, do not simply state it's missing. Instead, summarize what you can based on the highest-level regulatory or clinical review document available. Strive to provide some relevant context for every section.
    - The output MUST be a single, well-formed HTML string.
    - Begin the report with an \`<h1>Clinical Study Report</h1>\` tag.
    - For each section and subsection, create a corresponding HTML heading with an ID (e.g., \`<h2 id="section-9">9 INVESTIGATIONAL PLAN</h2>\`, \`<h3 id="section-9.1">9.1 Overall Study Design and Plan - Description</h3>\`).
    - Under each heading, write the body of the section using standard HTML tags like \`<p>\`, \`<ul>\`, \`<li>\`, \`<table>\`, etc., to structure the information clearly.

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
