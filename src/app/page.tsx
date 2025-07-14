"use client";

import { useState, useRef } from "react";
import { BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { Section } from "@/data/ich-e3-sections";
import { ichE3Sections } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";

function getInitialEditorContent(): string {
  let content = `<h1>Clinical Study Report</h1><p>Welcome to CSR DraftWise! This document is structured according to the ICH E3 guidelines.</p><p>Select a section from the navigator on the left to jump to it. You can begin writing your content directly in this editor.</p>`;
  
  const generateSections = (sections: Section[], level: number): string => {
    return sections.map(section => {
        const headingTag = `h${level > 6 ? 6 : level}`;
        const childrenContent = section.children ? generateSections(section.children, level + 1) : '';
        return `<${headingTag} id="section-${section.id}">${section.id} ${section.title}</${headingTag}><p>[Content for this section goes here.]</p>${childrenContent}`;
    }).join('');
  }

  content += generateSections(ichE3Sections, 2); // Start with <h2> for top-level sections
  return content;
}


export default function CsrDraftingPage() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editorContent, setEditorContent] = useState<string>(
    getInitialEditorContent()
  );
  
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

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
        title: "Section not found",
        description: `Section ${section.id} does not exist in the document.`,
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
        <aside className="w-[380px] shrink-0 border-r bg-card/50">
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
      </div>
    </div>
  );
}
