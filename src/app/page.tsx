"use client";

import { useState, useRef, useEffect } from "react";
import { BrainCircuit } from "lucide-react";
import { generateFullCsrDraft } from "@/ai/flows/generate-full-csr-draft";
import { useToast } from "@/hooks/use-toast";

import type { Section } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";
import { AiAssistant } from "@/components/ai-assistant";

export default function CsrDraftingPage() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editorContent, setEditorContent] = useState<string>(
    '<h1>Welcome to CSR DraftWise!</h1><p>To get started, upload your source document(s) using the panel on the right, then click "Generate Full Draft".</p>'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const handleGenerateDraft = async (fileContents: string[]) => {
    setIsLoading(true);
    try {
      const combinedContent = fileContents.join("\n\n---\n\n");
      const result = await generateFullCsrDraft({
        documentContents: combinedContent,
      });

      setEditorContent(result.fullDraft);

      toast({
        title: "Full Draft Generated",
        description: `The complete CSR draft has been generated in the editor.`,
      });
    } catch (error) {
      console.error("Error generating full draft:", error);
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

  const handleSectionSelect = (section: Section) => {
    setActiveSection(section);
    const editorContainer = editorRef.current;
    if (!editorContainer) return;

    const targetElement = editorContainer.querySelector(`#section-${section.id}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        toast({
            variant: "default",
            title: "Section not found",
            description: `Draft for section ${section.id} may not have been generated yet.`
        })
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
          />
        </aside>
      </div>
    </div>
  );
}
