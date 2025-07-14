"use client";

import { useState, useRef, useMemo } from "react";
import { BrainCircuit, Upload, Trash2, Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";

import type { Section } from "@/data/ich-e3-sections";
import { ichE3Sections } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";
import { generateCsrDraft } from "@/ai/flows/generate-csr-draft";
import { cn } from "@/lib/utils";

interface UploadedFile {
  name: string;
  content: string;
}

function getInitialEditorContent(): string {
  let content = `<h1>Clinical Study Report</h1><p>Welcome to CSR DraftWise! This document is structured according to the ICH E3 guidelines.</p><p>To get started, upload your source documents, select a section to draft, and click "Generate Draft". You can also begin writing your content directly in this editor.</p>`;

  const generateSections = (sections: Section[], level: number): string => {
    return sections
      .map((section) => {
        const headingTag = `h${level > 6 ? 6 : level}`;
        const childrenContent = section.children
          ? generateSections(section.children, level + 1)
          : "";
        return `<${headingTag} id="section-${section.id}">${section.id} ${section.title}</${headingTag}><p>[Content for this section goes here.]</p>${childrenContent}`;
      })
      .join("");
  };

  content += generateSections(ichE3Sections, 2); // Start with <h2> for top-level sections
  return content;
}

export default function CsrDraftingPage() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editorContent, setEditorContent] = useState<string>(
    getInitialEditorContent()
  );

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [selectedSectionForDrafting, setSelectedSectionForDrafting] =
    useState<Section | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);

  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSectionSelect = (
    section: Section,
    behavior: "auto" | "smooth" = "smooth"
  ) => {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFiles((prev) => [...prev, { name: file.name, content }]);
        if (!activeFile) {
          setActiveFile(file.name);
        }
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    if (activeFile === fileName) {
      setActiveFile(uploadedFiles.length > 1 ? uploadedFiles[0].name : null);
    }
  };

  const canGenerate = useMemo(() => {
    return (
      selectedSectionForDrafting &&
      activeFile &&
      uploadedFiles.some((f) => f.name === activeFile)
    );
  }, [selectedSectionForDrafting, activeFile, uploadedFiles]);

  const handleGenerateDraft = async () => {
    if (!canGenerate || !selectedSectionForDrafting) return;

    setIsGenerating(true);
    try {
      const sourceFile = uploadedFiles.find((f) => f.name === activeFile);
      if (!sourceFile) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Selected source file not found.",
        });
        return;
      }

      const response = await generateCsrDraft({
        sectionId: selectedSectionForDrafting.id,
        sectionTitle: selectedSectionForDrafting.title,
        sourceText: sourceFile.content,
      });

      const { draft } = response;

      const editorContainer = editorRef.current;
      if (editorContainer) {
        const sectionId = `section-${selectedSectionForDrafting.id}`;
        let targetElement = editorContainer.querySelector(`#${sectionId}`);

        if (targetElement) {
          let nextSibling = targetElement.nextElementSibling;
          while (nextSibling && !nextSibling.tagName.startsWith("H")) {
            const toRemove = nextSibling;
            nextSibling = nextSibling.nextElementSibling;
            toRemove.remove();
          }
          targetElement.insertAdjacentHTML("afterend", draft);
        } else {
          // If section does not exist, append it. This is a fallback.
          const newContent = `
            <h${selectedSectionForDrafting.id.split(".").length + 1} id="${sectionId}">
              ${selectedSectionForDrafting.id} ${selectedSectionForDrafting.title}
            </h${selectedSectionForDrafting.id.split(".").length + 1}>
            ${draft}
          `;
          editorContainer.innerHTML += newContent;
        }

        setEditorContent(editorContainer.innerHTML);
        handleSectionSelect(selectedSectionForDrafting, "smooth");
      }

      toast({
        title: "Draft Generated",
        description: `Content for section ${selectedSectionForDrafting.id} has been updated.`,
      });
    } catch (error: any) {
      console.error("Error generating draft:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description:
          error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const allSections: Section[] = useMemo(() => {
    const sections: Section[] = [];
    const collectSections = (s: Section[]) => {
      s.forEach(section => {
        sections.push(section);
        if (section.children) {
          collectSections(section.children);
        }
      });
    };
    collectSections(ichE3Sections);
    return sections;
  }, []);

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

        <main className="flex-1 flex p-4 gap-4 overflow-hidden">
          <WordEditor
            ref={editorRef}
            editorContent={editorContent}
            setEditorContent={setEditorContent}
          />
        </main>

        <aside className="w-[420px] shrink-0 border-l bg-card/50 p-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                AI Draft Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6 overflow-y-auto">
              <div className="space-y-4">
                <Label className="font-semibold text-lg">
                  1. Upload Source Documents
                </Label>
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept=".txt,.md,.html"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload text, markdown, or HTML files.
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div>
                    <Label className="font-medium">
                      Select active file for drafting:
                    </Label>
                    <RadioGroup
                      value={activeFile || ""}
                      onValueChange={setActiveFile}
                      className="mt-2 space-y-1"
                    >
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={file.name}
                              id={`radio-${file.name}`}
                            />
                            <Label
                              htmlFor={`radio-${file.name}`}
                              className="font-normal truncate"
                            >
                              {file.name}
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeFile(file.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className="font-semibold text-lg">
                  2. Select Section to Draft
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedSectionForDrafting
                        ? `${selectedSectionForDrafting.id} ${selectedSectionForDrafting.title}`
                        : "Select a section..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[370px] p-0">
                    <Command>
                      <CommandInput placeholder="Search section..." />
                      <CommandList>
                        <CommandEmpty>No section found.</CommandEmpty>
                        <CommandGroup>
                          {allSections.map((section) => (
                            <CommandItem
                              key={section.id}
                              value={`${section.id} ${section.title}`}
                              onSelect={() => {
                                setSelectedSectionForDrafting(section);
                                setOpen(false);
                              }}
                              style={{ paddingLeft: `${section.id.split('.').length * 1}rem` }}
                            >
                              {section.id} {section.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mt-auto pt-4 border-t">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateDraft}
                  disabled={!canGenerate || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
