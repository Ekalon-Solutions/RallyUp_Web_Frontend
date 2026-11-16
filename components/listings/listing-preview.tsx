"use client"

import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn, formatDisplayDate } from "@/lib/utils"
import { DEFAULT_CLUB_PRIMARY } from "@/lib/clubThemeButton"

export const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", JPY: "¥" }

export function money(amount: number, currency = "INR") {
  const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `
  return `${sym}${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

export function PreviewRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      {/* Tinted with the club colour set on ListingPreview, same as the Create Event preview. */}
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: "color-mix(in srgb, var(--preview-accent, #3b82f6) 10%, transparent)",
          color: "var(--preview-accent, #3b82f6)",
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="text-sm font-medium leading-snug break-words">{value || "—"}</div>
      </div>
    </div>
  )
}

export function formatPreviewDate(value: string) {
  return value ? formatDisplayDate(value) : "—"
}

export function formatPreviewTime(start: string, end?: string) {
  if (!start) return "—"
  const t = (v: string) => new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  return end ? `${t(start)} – ${t(end)}` : t(start)
}

// Same chip colours as the Create Event preview.
const CHIP_TONES: Record<string, string> = {
  Free: "text-green-600 border-green-400",
  "Member's Only": "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200",
}

/** "Event Preview" side card shared by the activity and donation wizards. */
export function ListingPreview({
  clubName,
  title,
  chips,
  primaryColor = DEFAULT_CLUB_PRIMARY,
  children,
}: {
  clubName?: string
  title: string
  chips: (string | false | null | undefined)[]
  primaryColor?: string
  children?: React.ReactNode
}) {
  return (
    <Card className="border-2 shadow-sm overflow-hidden" style={{ "--preview-accent": primaryColor } as React.CSSProperties}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Event Preview</CardTitle>
        <p className="text-xs text-muted-foreground">How members will see this event{clubName ? ` on ${clubName}` : ""}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {chips.filter(Boolean).map((chip) => (
            <Badge key={String(chip)} variant="outline" className={cn("rounded-full text-xs font-normal", CHIP_TONES[String(chip)])}>
              {chip}
            </Badge>
          ))}
        </div>
        <h3 className={cn("text-lg font-bold leading-snug", !title.trim() && "text-muted-foreground")}>
          {title.trim() || "Event title"}
        </h3>
        {children && (
          <>
            <Separator />
            <div className="space-y-3">{children}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
