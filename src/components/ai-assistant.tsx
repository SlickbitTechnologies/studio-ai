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
  onGenerateDraft: (fileContents: string[]) => Promise<void>;
  isLoading: boolean;
}

export function AiAssistant({
  activeSection,
  onGenerateDraft,
  isLoading,
}: AiAssistantProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleGenerateClick = () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files Uploaded",
        description: "Please upload at least one source document.",
      });
      return;
    }

    const fileReadPromises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) {
            resolve(text);
          } else {
            reject(new Error(`Could not read file: ${file.name}`));
          }
        };
        reader.onerror = () => {
          reject(new Error(`Error reading file: ${file.name}`));
        };
        reader.readAsText(file);
      });
    });

    Promise.all(fileReadPromises)
      .then(fileContents => {
        onGenerateDraft(fileContents);
      })
      .catch(error => {
        console.error(error);
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "An error occurred while reading the files.",
          });
      });
  };

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-lg">
          <Wand2 className="h-5 w-5 text-accent" />
          AI Draft Assistant
        </CardTitle>
        <CardDescription>
          Upload documents to generate content for the selected section.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        <div>
          <Label htmlFor="file-upload" className="font-medium">
            Upload Source Document(s)
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
                multiple
              />
            </Label>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">Uploaded Files:</p>
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-foreground p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="truncate font-medium">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handleGenerateClick}
            disabled={isLoading || files.length === 0 || !activeSection}
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
