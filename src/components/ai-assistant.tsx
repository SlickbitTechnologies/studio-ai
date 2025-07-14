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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Loader2, Wand2, ChevronDown, Check } from "lucide-react";
import type { Section } from "@/data/ich-e3-sections";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


interface AiAssistantProps {
  onGenerateDraft: (fileContent: string, section: Section) => Promise<void>;
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
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const { toast } = useToast();
  const [open, setOpen] = useState(false)

  const allSections = flattenSections(sections);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(newFiles);
      if (newFiles.length > 0 && !activeFile) {
        setActiveFile(newFiles[0].name);
      } else if (newFiles.length === 0) {
        setActiveFile(null);
      }
    }
  };

  const handleGenerateClick = () => {
    if (!activeFile) {
      toast({
        variant: "destructive",
        title: "No Active File",
        description: "Please select a source document to use for drafting.",
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

    const fileToProcess = files.find(f => f.name === activeFile);
    if (!fileToProcess) {
        toast({
            variant: "destructive",
            title: "File Not Found",
            description: "The selected active file could not be found.",
          });
          return;
    }


    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        onGenerateDraft(text, selectedSection);
      } else {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: `Could not read the content of ${fileToProcess.name}.`,
          });
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: `An error occurred while reading ${fileToProcess.name}.`,
          });
    };
    reader.readAsText(fileToProcess);
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
              <p className="text-sm font-medium">Select active source file:</p>
              <RadioGroup value={activeFile ?? ""} onValueChange={setActiveFile}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-foreground p-2 bg-muted rounded-md"
                  >
                    <RadioGroupItem value={file.name} id={`file-${index}`} className="shrink-0" />
                    <Label htmlFor={`file-${index}`} className="flex items-center gap-2 cursor-pointer w-full">
                        <FileText className="h-4 w-4 text-accent" />
                        <span className="truncate font-medium">{file.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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
            disabled={isLoading || files.length === 0 || !selectedSection || !activeFile}
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
