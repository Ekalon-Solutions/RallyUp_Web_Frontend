"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ListOrdered } from "lucide-react"

type WaitlistConfig = {
  enabled?: boolean
  purchaseWindowHours?: number
}

type Props = {
  waitlist?: WaitlistConfig | null
  /** For create preview — pass when waitlist object is not persisted yet */
  enabled?: boolean
  purchaseWindowHours?: number | string | null
  variant?: "badge" | "row" | "inline"
  className?: string
  primaryColor?: string
}

export function isWaitlistEnabled(
  waitlist?: WaitlistConfig | null,
  enabled?: boolean
): boolean {
  if (enabled != null) return enabled
  return Boolean(waitlist?.enabled)
}

function resolvePurchaseWindowHours(
  waitlist?: WaitlistConfig | null,
  override?: number | string | null
): number | null {
  const raw = override ?? waitlist?.purchaseWindowHours
  if (raw == null || raw === "") return null
  const hours = Number(raw)
  if (!Number.isFinite(hours) || hours <= 0) return null
  return hours
}

function purchaseWindowLabel(hours: number): string {
  return `${hours} hour${hours === 1 ? "" : "s"} to purchase`
}

export function WaitlistDisplay({
  waitlist,
  enabled,
  purchaseWindowHours,
  variant = "badge",
  className,
  primaryColor = "#3b82f6",
}: Props) {
  if (!isWaitlistEnabled(waitlist, enabled)) return null

  const windowHours = resolvePurchaseWindowHours(waitlist, purchaseWindowHours)
  const windowText = windowHours != null ? purchaseWindowLabel(windowHours) : null
  const detailText = windowText
    ? `Waitlist when full — ${windowText} if offered a spot`
    : "Waitlist when event is full"

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <ListOrdered className="w-3 h-3 shrink-0" />
        <span>{detailText}</span>
      </div>
    )
  }

  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        title={detailText}
        className={cn(
          "text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 max-w-full",
          className
        )}
      >
        <ListOrdered className="w-3 h-3 mr-1 shrink-0" />
        <span className="truncate">
          Waitlist{windowText ? ` · ${windowText}` : ""}
        </span>
      </Badge>
    )
  }

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
      >
        <ListOrdered className="h-4 w-4" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Waitlist
        </p>
        <p className="font-medium leading-snug">{detailText}</p>
      </div>
    </div>
  )
}
