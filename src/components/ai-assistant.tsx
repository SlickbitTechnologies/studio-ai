"use client";

import { useState } from "react";
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
import { UploadCloud, FileText, Loader2, Wand2, ChevronDown, Check } from "lucide-react";
import type { Section } from "@/data/ich-e3-sections";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


interface AiAssistantProps {
  onGenerateDraft: (fileContents: string[], section: Section) => Promise<void>;
  isLoading: boolean;
  selectedSection: Section | null;
  sections: Section[];
  setSelectedSection: (section: Section | null) => void;
}


const flattenSections = (sections: Section[]): Section[] => {
  let flat: Section[] = [];
  sections.forEach(section => {
    flat.push(section);
    if (section.children) {
      flat = flat.concat(flattenSections(section.children));
    }
  });
  return flat;
};


export function AiAssistant({
  onGenerateDraft,
  isLoading,
  selectedSection,
  sections,
  setSelectedSection,
}: AiAssistantProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const [open, setOpen] = useState(false)

  const allSections = flattenSections(sections);

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

    if (!selectedSection) {
        toast({
            variant: "destructive",
            title: "No Section Selected",
            description: "Please select a section to generate a draft for.",
          });
          return;
    }

    const fileReadPromises = files.map((file) => {
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
      .then((fileContents) => {
        onGenerateDraft(fileContents, selectedSection);
      })
      .catch((error) => {
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
          Generate a draft for a specific CSR section.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        <div>
          <Label htmlFor="file-upload" className="font-medium">
            1. Upload Source Document(s)
          </Label>
          <div className="mt-2">
            <Label
              htmlFor="file-upload"
              className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-accent">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
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
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-foreground p-2 bg-muted rounded-md"
                >
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="truncate font-medium">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
            <Label className="font-medium">
                2. Select Section for Drafting
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between mt-2"
                >
                {selectedSection
                    ? `${selectedSection.id} ${selectedSection.title}`
                    : "Select section..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0">
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
                            setSelectedSection(section)
                            setOpen(false)
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


        <div className="mt-auto">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handleGenerateClick}
            disabled={isLoading || files.length === 0 || !selectedSection}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Generate Section Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
