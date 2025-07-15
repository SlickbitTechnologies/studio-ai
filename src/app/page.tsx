
"use client";

import { useState, useRef, useMemo } from "react";
import { BrainCircuit, Upload, Trash2, Wand2, Loader2, FileText, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { Section } from "@/data/ich-e3-sections";
import { ichE3Sections } from "@/data/ich-e3-sections";
import { IchE3Navigator } from "@/components/ich-e3-navigator";
import { WordEditor } from "@/components/word-editor";

import { generateCsrDraft } from "@/ai/flows/generate-csr-draft";
import { mapContentToSections } from "@/ai/flows/map-content-to-sections";
import type { ContentMappingOutput } from "@/ai/flows/map-content-to-sections";

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
  let content = `<h1>Clinical Study Report</h1><p>Welcome to CSR DraftWise! This document is structured according to the ICH E3 guidelines.</p><p>To get started, upload your source documents and click "Generate Full Draft".</p>`;

  const generateSections = (sections: Section[], level: number): string => {
    return sections
      .map((section) => {
        const headingTag = `h${level > 6 ? 6 : level}`;
        const childrenContent = section.children
          ? generateSections(section.children, level + 1)
          : "";
        const placeholder = `<p data-placeholder-for="section-${section.id}">[Content for this section will be generated here.]</p>`;
        return `<${headingTag} id="section-${section.id}">${section.id} ${section.title}</${headingTag}>${placeholder}${childrenContent}`;
      })
      .join("");
  };

  content += generateSections(ichE3Sections, 2); // Start with <h2> for top-level sections
  return content;
}

// Helper function to introduce a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic with exponential backoff for handling API errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 5000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if ((err.message.includes('429') || err.message.includes('503')) && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Function failed after multiple retries.");
}


export default function CsrDraftingPage() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editorContent, setEditorContent] = useState<string>(
    getInitialEditorContent()
  );

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSectionTitle, setCurrentSectionTitle] = useState("");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

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
           toast({ variant: "destructive", title: "Unsupported File", description: `Could not process ${file.name}. Only PDF and DOCX are supported.` });
          continue;
        }
        
        const newFile = { name: file.name, content };
        setUploadedFiles((prev) => [...prev, newFile]);
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
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const canGenerate = useMemo(() => {
    return uploadedFiles.length > 0;
  }, [uploadedFiles]);

  const handleGenerateFullDraft = async () => {
    if (!canGenerate) return;
  
    setIsGenerating(true);
    let currentEditorContent = getInitialEditorContent();
    setEditorContent(currentEditorContent);
    const failedSections: string[] = [];
  
    // Step 1: Map Content to Sections
    setCurrentSectionTitle("Step 1 of 2: Analyzing source documents...");
    setGenerationProgress(10); // Initial progress for analysis step
    
    const combinedSourceText = uploadedFiles.map((f) => f.content).join("\n\n---\n\n");
    let contentMap: ContentMappingOutput;
    
    try {
      contentMap = await mapContentToSections({
        sourceText: combinedSourceText,
        sections: allSections.map(s => ({ id: s.id, title: s.title })),
      });
      setGenerationProgress(30); // Progress after successful analysis
    } catch (error) {
      console.error("Error during content mapping:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze source documents. Please try again.",
        duration: 9000,
      });
      setIsGenerating(false);
      return;
    }
    
    // Step 2: Generate Draft for Each Section
    setCurrentSectionTitle("Step 2 of 2: Drafting sections...");
    
    const sectionMappings = contentMap.sectionMappings;
    
    for (let i = 0; i < sectionMappings.length; i++) {
      const mapping = sectionMappings[i];
      setCurrentSectionTitle(`Drafting section ${mapping.sectionId}: ${mapping.sectionTitle}`);
  
      // Skip drafting if no relevant text was found
      if (!mapping.relevantText) {
          const progress = 30 + Math.round(((i + 1) / sectionMappings.length) * 70);
          setGenerationProgress(progress);
          continue;
      }

      try {
        const response = await retryWithBackoff(() => 
          generateCsrDraft({
            sectionId: mapping.sectionId,
            sectionTitle: mapping.sectionTitle,
            sourceText: mapping.relevantText, // Use mapped text
          })
        );
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentEditorContent;
        const placeholder = tempDiv.querySelector(`[data-placeholder-for="section-${mapping.sectionId}"]`);
        if (placeholder) {
          placeholder.outerHTML = response.draft;
        }
        currentEditorContent = tempDiv.innerHTML;
        setEditorContent(currentEditorContent);
  
      } catch (error) {
        console.error(`Error generating draft for section ${mapping.sectionId} after retries:`, error);
        failedSections.push(mapping.sectionId);
      }
  
      const progress = 30 + Math.round(((i + 1) / sectionMappings.length) * 70);
      setGenerationProgress(progress);
    }
  
    if (failedSections.length > 0) {
      toast({
        variant: "destructive",
        title: "Draft Generation Partially Complete",
        description: `Failed to generate ${failedSections.length} section(s): ${failedSections.join(', ')}. Please review the document.`,
        duration: 9000,
      });
    } else {
      toast({
        title: "Full Draft Generation Complete",
        description: "All sections have been processed successfully.",
      });
    }
  
    setIsGenerating(false);
    setCurrentSectionTitle("");
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
      <div className="flex flex-1 min-h-0 relative">
        <aside className={cn(
          "bg-card/50 border-r transition-all duration-300 ease-in-out",
          isLeftPanelCollapsed ? "w-0" : "w-[380px]"
        )}>
          <div className="h-full w-[380px]">
            <IchE3Navigator
              activeSection={activeSection}
              setActiveSection={handleSectionSelectInNav}
            />
          </div>
        </aside>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 bg-card z-10 h-24 w-6 rounded-l-none"
          style={{ left: isLeftPanelCollapsed ? '0px' : '380px', transition: 'left 300ms ease-in-out' }}
        >
          {isLeftPanelCollapsed ? <ChevronsRight className="h-5 w-5"/> : <ChevronsLeft className="h-5 w-5"/>}
        </Button>


        <main className="flex-1 flex p-4 gap-4 overflow-hidden">
          <WordEditor
            ref={editorRef}
            editorContent={editorContent}
            setEditorContent={setEditorContent}
          />
        </main>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 bg-card z-10 h-24 w-6 rounded-r-none"
          style={{ right: isRightPanelCollapsed ? '0px' : '420px', transition: 'right 300ms ease-in-out' }}
        >
          {isRightPanelCollapsed ? <ChevronsLeft className="h-5 w-5"/> : <ChevronsRight className="h-5 w-5"/>}
        </Button>

        <aside className={cn(
          "bg-card/50 border-l transition-all duration-300 ease-in-out p-4",
          isRightPanelCollapsed ? "w-0 p-0" : "w-[420px]"
        )}>
          <div className={cn("h-full w-[388px] transition-opacity", isRightPanelCollapsed && 'opacity-0')}>
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
                      disabled={isGenerating}
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
                      accept=".pdf,.docx"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload PDF or DOCX files.
                    </p>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div>
                      <Label className="font-medium">
                        Uploaded files:
                      </Label>
                      <ScrollArea className="h-40 mt-2">
                        <div className="space-y-1 pr-4">
                            {uploadedFiles.map((file) => (
                              <div
                                key={file.name}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                              >
                                <div className="flex items-center gap-2 truncate flex-1">
                                  <FileText className="h-4 w-4 text-muted-foreground"/>
                                  <span className="font-normal truncate">{file.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => removeFile(file.name)}
                                  disabled={isGenerating}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                 <div className="space-y-4">
                  <Label className="font-semibold text-lg">
                    2. Generate Full Draft
                  </Label>
                  <p className="text-sm text-muted-foreground">
                      Click the button below to generate a draft for the entire report. The AI will first analyze all documents, then draft each section.
                  </p>
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground animate-pulse">
                      {generationProgress < 100
                        ? `${currentSectionTitle}`
                        : "Finalizing document..."}
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerateFullDraft}
                    disabled={!canGenerate || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Full Draft
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

    