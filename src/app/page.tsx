
"use client";

import { useState, useRef, useMemo } from "react";
import { BrainCircuit, Upload, Trash2, Wand2, Loader2, ChevronDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { Section } from "@/data/ich-e3-sections";
import { ichE3Sections } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";
import { generateCsrDraft } from "@/ai/flows/generate-csr-draft";
import { cn } from "@/lib/utils";
import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";

// Set worker path for pdfjs
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface UploadedFile {
  name: string;
  content: string;
}

function getInitialEditorContent(): string {
  let content = `<h1>Clinical Study Report</h1><p>Welcome to CSR DraftWise! This document is structured according to the ICH E3 guidelines.</p><p>To get started, upload your source documents, select a section, and click "Generate Draft".</p>`;

  const generateSections = (sections: Section[], level: number): string => {
    return sections
      .map((section) => {
        const headingTag = `h${level > 6 ? 6 : level}`;
        const childrenContent = section.children
          ? generateSections(section.children, level + 1)
          : "";
        const placeholder = `<p>[Content for this section will be generated here.]</p>`;
        return `<${headingTag} id="section-${section.id}">${section.id} ${section.title}</${headingTag}>${placeholder}${childrenContent}`;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isSectionSelectorOpen, setSectionSelectorOpen] = useState(false);

  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSectionSelectInNav = (
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
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        let content = "";
        if (file.type === "application/pdf") {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument(arrayBuffer).promise;
          let textContent = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((item: any) => item.str).join(" ");
          }
          content = textContent;
        } else if (file.name.endsWith(".docx")) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        } else {
          content = await file.text();
        }
        
        const newFile = { name: file.name, content };
        setUploadedFiles((prev) => {
          const newFiles = [...prev, newFile];
          if(newFiles.length === 1) {
            setActiveFile(newFile.name);
          }
          return newFiles;
        });
        toast({ title: "File Uploaded", description: `${file.name} has been successfully processed.`});
      } catch (error) {
        console.error("Error processing file:", error);
        toast({ variant: "destructive", title: "File Error", description: `Could not process ${file.name}.` });
      }
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((f) => f.name !== fileName);
      if (activeFile === fileName) {
        setActiveFile(newFiles.length > 0 ? newFiles[0].name : null);
      }
      return newFiles;
    });
  };

  const canGenerate = useMemo(() => {
    return !!activeFile && !!selectedSection;
  }, [activeFile, selectedSection]);

  const handleGenerateDraft = async () => {
    if (!canGenerate || !selectedSection || !activeFile) return;

    setIsGenerating(true);

    const sourceFile = uploadedFiles.find(f => f.name === activeFile);
    if (!sourceFile) {
        toast({ variant: "destructive", title: "Source file not found." });
        setIsGenerating(false);
        return;
    }

    try {
      const response = await generateCsrDraft({
        sectionId: selectedSection.id,
        sectionTitle: selectedSection.title,
        sourceText: sourceFile.content,
      });

      const { draft } = response;

      const sectionId = `section-${selectedSection.id}`;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorContent;

      const targetElement = tempDiv.querySelector(`#${sectionId}`);
      if (targetElement) {
        let placeholder = targetElement.nextElementSibling;
        if (placeholder && placeholder.tagName === 'P' && placeholder.textContent?.includes('[Content for this section')) {
          placeholder.outerHTML = draft; // Replace placeholder with draft
        } else {
          targetElement.insertAdjacentHTML("afterend", draft);
        }
        setEditorContent(tempDiv.innerHTML);
        handleSectionSelectInNav(selectedSection, 'auto');
      } else {
         toast({
            variant: "destructive",
            title: "Section Not Found",
            description: `Could not find section ${selectedSection.id} in the editor.`,
        });
      }
      
      toast({
        title: `Draft Generated for ${selectedSection.id}`,
        description: `Content for "${selectedSection.title}" has been inserted.`,
      });

    } catch (error: any) {
      console.error(`Error generating draft for section ${selectedSection.id}:`, error);
      toast({
        variant: "destructive",
        title: `AI Generation Failed`,
        description: error.message || "An unexpected error occurred.",
      });
    }

    setIsGenerating(false);
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
            setActiveSection={handleSectionSelectInNav}
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
                    accept=".txt,.md,.html,.pdf,.docx"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload PDF, DOCX, TXT, MD, or HTML files.
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div>
                    <Label className="font-medium">
                      Select active source document:
                    </Label>
                    <ScrollArea className="h-40 mt-2">
                      <RadioGroup value={activeFile || ""} onValueChange={setActiveFile}>
                        <div className="space-y-1 pr-4">
                          {uploadedFiles.map((file) => (
                            <div
                              key={file.name}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                            >
                              <Label htmlFor={file.name} className="flex items-center gap-3 cursor-pointer truncate flex-1">
                                  <RadioGroupItem value={file.name} id={file.name} />
                                  <span className="font-normal truncate">{file.name}</span>
                              </Label>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => removeFile(file.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </ScrollArea>
                  </div>
                )}
              </div>

               <div className="space-y-4">
                <Label className="font-semibold text-lg">
                  2. Select Section to Draft
                </Label>
                <Popover open={isSectionSelectorOpen} onOpenChange={setSectionSelectorOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isSectionSelectorOpen}
                            className="w-full justify-between"
                        >
                            {selectedSection
                                ? `${selectedSection.id} ${selectedSection.title}`
                                : "Select a section..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                setSelectedSection(section);
                                                setSectionSelectorOpen(false);
                                                handleSectionSelectInNav(section, 'auto');
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedSection?.id === section.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
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
                      Generating Section...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Section Draft
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

    