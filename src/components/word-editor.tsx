"use client";

import { useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Table,
  MessageSquare,
  Repeat,
  Undo,
  Redo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WordEditorProps {
  editorContent: string;
  setEditorContent: (content: string) => void;
}

const ToolbarButton = ({
  children,
  tooltip,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
        disabled={disabled}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{tooltip}</p>
    </TooltipContent>
  </Tooltip>
);

export function WordEditor({
  editorContent,
  setEditorContent,
}: WordEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Note: execCommand is deprecated but is the simplest way to demonstrate functionality
  // for a prototype. A production app should use a robust rich text editor library.
  const applyCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
        setEditorContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setEditorContent(e.currentTarget.innerHTML);
  };
  
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col rounded-lg border bg-card shadow-sm">
        <div className="p-2 border-b flex items-center flex-wrap gap-1">
          <ToolbarButton tooltip="Undo (Ctrl+Z)" onClick={() => applyCommand("undo")}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Redo (Ctrl+Y)" onClick={() => applyCommand("redo")}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Heading 1" onClick={() => applyCommand("formatBlock", "<h1>")}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Heading 2" onClick={() => applyCommand("formatBlock", "<h2>")}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Heading 3" onClick={() => applyCommand("formatBlock", "<h3>")}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton
            tooltip="Bold (Ctrl+B)"
            onClick={() => applyCommand("bold")}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Italic (Ctrl+I)"
            onClick={() => applyCommand("italic")}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Underline (Ctrl+U)"
            onClick={() => applyCommand("underline")}
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Bulleted List" onClick={() => applyCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Numbered List" onClick={() => applyCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Insert Table" disabled>
            <Table className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Track Changes" disabled>
            <Repeat className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Comments" disabled>
            <MessageSquare className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div className="flex-1 p-4 bg-background/50 rounded-b-lg relative overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            dangerouslySetInnerHTML={{ __html: editorContent }}
            className="w-full h-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-8 shadow-inner bg-card prose dark:prose-invert max-w-none"
            style={{ lineHeight: '1.75' }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
