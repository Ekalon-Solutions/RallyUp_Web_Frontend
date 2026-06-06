"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface UsageMeterProps {
  current: number
  max: number
  label: string
  className?: string
}

export function UsageMeter({ current, max, label, className }: UsageMeterProps) {
  if (max <= 0) return null
  const pct = Math.min(100, Math.round((current / max) * 100))
  const critical = pct >= 90
  const warning = pct >= 70

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {critical && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
          {label}
        </span>
        <span className={cn(
          "tabular-nums",
          critical ? "text-destructive" : warning ? "text-amber-600" : "text-muted-foreground"
        )}>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            critical ? "bg-destructive" : warning ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {critical && (
        <p className="text-[11px] text-destructive font-medium">
          Limit nearly reached. Contact RallyUp to increase your allowance.
        </p>
      )}
    </div>
  )
}
