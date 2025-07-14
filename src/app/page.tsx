"use client";

import { useState } from "react";
import { FileText, BotMessageSquare, BrainCircuit } from "lucide-react";
import { generateCsrDraft } from "@/ai/flows/generate-csr-draft";
import { useToast } from "@/hooks/use-toast";

import type { Section } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";
import { AiAssistant } from "@/components/ai-assistant";

export default function CsrDraftingPage() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editorContent, setEditorContent] = useState<string>(
    'Welcome to CSR DraftWise!\n\nSelect a section from the left navigation, upload a source document on the right, and click "Generate Draft" to get started.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerateDraft = async (fileContent: string) => {
    if (!activeSection) {
      toast({
        variant: "destructive",
        title: "No Section Selected",
        description: "Please select a CSR section from the left panel first.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateCsrDraft({
        sectionId: `${activeSection.id} - ${activeSection.title}`,
        localFileContent: fileContent,
      });

      const draft = `\n\n------------------------------\nDRAFT FOR: ${activeSection.id} ${activeSection.title}\n------------------------------\n\n${result.draftContent}`;
      setEditorContent((prev) => prev + draft);

      toast({
        title: "Draft Generated",
        description: `AI draft for section ${activeSection.id} has been added to the editor.`,
      });
    } catch (error) {
      console.error("Error generating draft:", error);
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
            setActiveSection={setActiveSection}
          />
        </aside>

        <main className="flex-1 flex flex-col p-4 gap-4">
          <WordEditor
            editorContent={editorContent}
            setEditorContent={setEditorContent}
          />
        </main>

        <aside className="w-[380px] shrink-0 border-l bg-card/50 p-4">
          <AiAssistant
            activeSection={activeSection}
            onGenerateDraft={handleGenerateDraft}
            isLoading={isLoading}
          />
        </aside>
      </div>
    </div>
  );
}
