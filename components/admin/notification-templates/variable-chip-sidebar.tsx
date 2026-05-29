"use client";

import { VARIABLE_CATEGORIES } from "@/lib/notification-template-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical } from "lucide-react";

type Props = {
  onInsert: (placeholder: string) => void;
};

export function VariableChipSidebar({ onInsert }: Props) {
  return (
    <aside className="fixed right-4 top-28 z-30 hidden w-64 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur lg:block xl:w-72">
      <div className="mb-2 flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Variables</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Click or drag a chip to insert at the cursor.
      </p>
      <ScrollArea className="h-[calc(100vh-12rem)] pr-2">
        <div className="space-y-4">
          {Object.entries(VARIABLE_CATEGORIES).map(([key, group]) => (
            <div key={key}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.variables.map((variable) => {
                  const placeholder = `{{${variable}}}`;
                  return (
                    <button
                      key={variable}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", placeholder);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onInsert(placeholder)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-90 ${group.color}`}
                      title={`Insert ${placeholder}`}
                    >
                      {variable}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

export function VariableChipInlineBar({ onInsert }: Props) {
  return (
    <div className="space-y-3 lg:hidden">
      {Object.entries(VARIABLE_CATEGORIES).map(([key, group]) => (
        <div key={key}>
          <Badge variant="outline" className="mb-2">
            {group.label}
          </Badge>
          <div className="flex flex-wrap gap-2">
            {group.variables.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => onInsert(`{{${variable}}}`)}
                className={`rounded-full border px-2 py-0.5 text-xs ${group.color}`}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
