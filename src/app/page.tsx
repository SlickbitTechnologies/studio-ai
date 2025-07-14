"use client";

import { useState, useRef, useEffect } from "react";
import { BrainCircuit, Loader2, Wand2 } from "lucide-react";
import { generateCsrDraft } from "@/ai/flows/generate-csr-draft";
import { useToast } from "@/hooks/use-toast";

import type { Section } from "@/data/ich-e3-sections";
import { ichE3Sections } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";
import { AiAssistant } from "@/components/ai-assistant";
import { Button } from "@/components/ui/button";

export default function CsrDraftingPage() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editorContent, setEditorContent] = useState<string>(
    `<h1>Welcome to CSR DraftWise!</h1><p>To get started, select a section from the left panel, upload your source document(s) using the panel on the right, and click "Generate Section Draft".</p>`
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSectionForDraft, setSelectedSectionForDraft] =
    useState<Section | null>(null);

  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const handleGenerateDraft = async (
    fileContents: string[],
    section: Section
  ) => {
    setIsLoading(true);
    try {
      const combinedContent = fileContents.join("\n\n---\n\n");
      const result = await generateCsrDraft({
        localFileContent: combinedContent,
        sectionId: `${section.id} ${section.title}`,
      });

      const sectionId = `section-${section.id}`;
      const editorDiv = (editorRef.current as HTMLDivElement)?.querySelector(
        ".prose"
      );

      if (!editorDiv) {
        throw new Error("Editor content area not found.");
      }

      let sectionElement = editorDiv.querySelector(`#${sectionId}`);

      // Determine the correct heading level
      const level = section.id.split(".").length;
      const headingTag = `h${level > 6 ? 6 : level}`;

      if (!sectionElement) {
        // If the section doesn't exist, create it.
        const newSectionHtml = `
          <${headingTag} id="${sectionId}">${section.id} ${section.title}</${headingTag}>
          <div>${result.draftContent}</div>
        `;
        // Append at the end for simplicity
        editorDiv.innerHTML += newSectionHtml;
      } else {
        // If the section exists, replace its content.
        // Find the content div immediately following the heading
        let contentDiv = sectionElement.nextElementSibling;
        if (contentDiv && contentDiv.tagName.toLowerCase() !== 'div') {
            // If the next element is another heading, we need to insert a div
            const newContentDiv = document.createElement('div');
            newContentDiv.innerHTML = result.draftContent;
            sectionElement.after(newContentDiv);
        } else if (contentDiv) {
             contentDiv.innerHTML = result.draftContent;
        } else {
            const newContentDiv = document.createElement('div');
            newContentDiv.innerHTML = result.draftContent;
            sectionElement.after(newContentDiv);
        }
      }

      setEditorContent(editorDiv.innerHTML);
      // Wait for state to update then scroll
      setTimeout(() => {
        handleSectionSelect(section, 'smooth');
      }, 100)


      toast({
        title: "Section Draft Generated",
        description: `Draft for section ${section.id} has been generated and inserted into the editor.`,
      });
    } catch (error) {
      console.error("Error generating section draft:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description:
          "An error occurred while generating the draft. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionSelect = (section: Section, behavior: 'auto' | 'smooth' = 'smooth') => {
    setActiveSection(section);
    const editorContainer = editorRef.current;
    if (!editorContainer) return;

    const targetElement = editorContainer.querySelector(
      `#section-${section.id}`
    );
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: behavior, block: "start" });
    } else {
      toast({
        variant: "default",
        title: "Section not found in document",
        description: `You can generate the draft for section ${section.id} using the AI assistant.`,
      });
    }
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col font-body">
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">
            CSR DraftWise
          </h1>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-[320px] shrink-0 border-r bg-card/50">
          <IchE3Navigator
            activeSection={activeSection}
            setActiveSection={handleSectionSelect}
            onSelectForDrafting={setSelectedSectionForDraft}
          />
        </aside>

        <main className="flex-1 flex flex-col p-4 gap-4">
          <WordEditor
            ref={editorRef}
            editorContent={editorContent}
            setEditorContent={setEditorContent}
          />
        </main>

        <aside className="w-[380px] shrink-0 border-l bg-card/50 p-4">
          <AiAssistant
            onGenerateDraft={handleGenerateDraft}
            isLoading={isLoading}
            selectedSection={selectedSectionForDraft}
            sections={ichE3Sections}
            setSelectedSection={setSelectedSectionForDraft}
          />
        </aside>
      </div>
    </div>
  );
}
