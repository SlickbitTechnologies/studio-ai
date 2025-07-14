"use client";

import { useState } from "react";
import type { Section } from "@/data/ich-e3-sections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Loader2, Wand2 } from "lucide-react";

interface AiAssistantProps {
  activeSection: Section | null;
  onGenerateDraft: (fileContent: string) => Promise<void>;
  isLoading: boolean;
}

export function AiAssistant({
  activeSection,
  onGenerateDraft,
  isLoading,
}: AiAssistantProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleGenerateClick = () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No File Uploaded",
        description: "Please upload a source document first.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        await onGenerateDraft(text);
      } else {
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the content of the uploaded file.",
        });
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "An error occurred while reading the file.",
          });
    }
    reader.readAsText(file);
  };

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-lg">
          <Wand2 className="h-5 w-5 text-accent" />
          AI Draft Assistant
        </CardTitle>
        <CardDescription>
          Generate content for the selected section using a source document.
          Your files are processed locally and never stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        <div>
          <Label htmlFor="file-upload" className="font-medium">
            1. Upload Source Document
          </Label>
          <div className="mt-2">
            <Label
              htmlFor="file-upload"
              className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-accent">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, or TXT
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
              />
            </Label>
          </div>
          {file && (
            <div className="mt-3 flex items-center gap-2 text-sm text-foreground p-2 bg-muted rounded-md">
              <FileText className="h-4 w-4 text-accent" />
              <span className="truncate font-medium">{file.name}</span>
            </div>
          )}
        </div>

        <div>
          <p className="font-medium mb-2">2. Select Section</p>
          <div className="w-full p-3 text-sm rounded-md border bg-muted/50">
            {activeSection ? (
              <p className="font-semibold text-foreground truncate">
                <span className="font-mono text-accent">{activeSection.id}</span> {activeSection.title}
              </p>
            ) : (
              <p className="text-muted-foreground">No section selected</p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handleGenerateClick}
            disabled={isLoading || !file || !activeSection}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Generate Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
