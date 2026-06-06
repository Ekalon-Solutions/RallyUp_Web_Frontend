"use client"

import { Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface LockedInlineProps {
  label: string
  reason?: string
  className?: string
}

/**
 * Drop-in replacement for a UI element that is inaccessible due to a disabled
 * feature. Renders a faded, non-interactive pill with a tooltip explaining the
 * lock. Useful for partial masking (e.g. hiding an "Export" button when the
 * Reporting module is off) without removing the element entirely.
 */
export function LockedInline({ label, reason, className }: LockedInlineProps) {
  return (
    <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-disabled="true"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
            "bg-muted/60 text-muted-foreground/60 border border-dashed border-muted-foreground/20",
            "cursor-not-allowed select-none",
            className
          )}
        >
          <Lock className="w-3 h-3 flex-shrink-0" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-center">
        {reason ?? "This feature isn't enabled for your club. Contact RallyUp to unlock it."}
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  )
}
