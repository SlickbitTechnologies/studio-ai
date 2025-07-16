
"use client";

import * as React from "react";
import type { Section } from "@/data/ich-e3-sections";
import { ichE3Sections } from "@/data/ich-e3-sections";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText } from "lucide-react";

interface IchE3NavigatorProps {
  activeSection: Section | null;
  setActiveSection: (section: Section) => void;
}

const SectionItem = ({
  section,
  activeSection,
  setActiveSection,
  level = 0,
}: {
  section: Section;
  level?: number;
} & Omit<IchE3NavigatorProps, 'onSelectForDrafting'>) => {
  const isActive = activeSection?.id === section.id;
  const displayNumber = `${section.id}.`;

  if (section.children && section.children.length > 0) {
    return (
      <Collapsible>
        <div className="flex items-center group pr-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex-1 justify-start h-8 pl-2 pr-1"
              )}
              style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
              onClick={() => setActiveSection(section)}
            >
              <ChevronRight className="h-4 w-4 mr-2 transition-transform duration-200" />
              <span className="font-semibold truncate">
                <span className="inline-block w-10 text-left">{displayNumber}</span>
                {section.title}
              </span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex flex-col">
            {section.children.map((child) => (
              <SectionItem
                key={child.id}
                section={child}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                level={level + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="flex items-center group pr-2">
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn("w-full justify-start h-8 flex-1", isActive && "font-bold")}
        onClick={() => setActiveSection(section)}
        style={{ paddingLeft: `${level * 1 + 1.5}rem` }}
      >
        <span className="truncate">
          <span className="inline-block w-10 text-left">{displayNumber}</span>
          {section.title}
        </span>
      </Button>
    </div>
  );
};

export function IchE3Navigator({
  activeSection,
  setActiveSection,
}: IchE3NavigatorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="flex items-center gap-2 text-lg font-semibold font-headline">
          <FileText className="h-5 w-5 text-accent" />
          CSR Template
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {ichE3Sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
