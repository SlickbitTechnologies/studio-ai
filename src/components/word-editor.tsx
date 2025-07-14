"use client";

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
import { Textarea } from "@/components/ui/textarea";
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
}: {
  children: React.ReactNode;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
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
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col rounded-lg border bg-card shadow-sm">
        <div className="p-2 border-b flex items-center flex-wrap gap-1">
          <ToolbarButton tooltip="Undo (Ctrl+Z)">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Redo (Ctrl+Y)">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Heading 1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Heading 3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Bold (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Italic (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Underline (Ctrl+U)">
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Bulleted List">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Numbered List">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Insert Table">
            <Table className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton tooltip="Track Changes">
            <Repeat className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Comments">
            <MessageSquare className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div className="flex-1 p-4 bg-background/50 rounded-b-lg relative">
          <div className="absolute top-2 right-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
            Note: This is a simplified editor. A real implementation would embed Microsoft Word Online.
          </div>
          <Textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-8 shadow-inner bg-card"
            placeholder="Your document content appears here..."
            style={{ lineHeight: '1.75' }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
