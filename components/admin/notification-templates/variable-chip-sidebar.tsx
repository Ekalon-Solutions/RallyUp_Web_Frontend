"use client";

import { VARIABLE_CATEGORIES } from "@/lib/notification-template-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical } from "lucide-react";

// Color map lives here so Tailwind's content scan always sees these classes
// (lib/ files may be excluded depending on tailwind.config content paths).
const CHIP_COLORS: Record<string, string> = {
  member:     "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  event:      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  club:       "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
  order:      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  content:    "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  membership: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
};

function chipColor(key: string): string {
  return CHIP_COLORS[key] ?? "bg-muted text-muted-foreground border-border";
}

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
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-90 ${chipColor(key)}`}
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
    <div className="space-y-3">
      {Object.entries(VARIABLE_CATEGORIES).map(([key, group]) => (
        <div key={key}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.variables.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => onInsert(`{{${variable}}}`)}
                className={`rounded-full border px-2 py-0.5 text-xs transition-opacity hover:opacity-75 ${chipColor(key)}`}
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
