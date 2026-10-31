"use client"

/**
 * ReportShell — Page-level wrapper for every report.
 *
 * Provides a consistent header (title, description, category badge),
 * a filter slot, and a content slot. Individual report pages compose
 * ReportShell with <ReportFilters />, <ReportSummaryCards />, and <ReportTable />.
 *
 * Design mirrors the card-based layout used in logistics-report-panel.tsx
 * and vendor-reports/page.tsx but generalised to accept children.
 */

import { createContext, useContext, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Category Colour Map ──────────────────────────────────────────────────────

const CATEGORY_COLOURS: Record<string, string> = {
  logistics:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  revenue:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  lifecycle:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  governance: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  billing:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  ads:        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
}

// ─── Embedded Mode ────────────────────────────────────────────────────────────

/**
 * Set by the Reporting & Analytics hub when it renders a report page inline
 * under a tab. The shell then drops its back link and cards and lays the
 * report out as: filter bar → sub-report pills → table header → table.
 */
export const EmbeddedReportContext = createContext<{ pills: ReactNode; showSummary?: boolean } | null>(null)

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportShellProps {
  /** Report title shown in the page header */
  title: string
  /** One-line description of what the report contains */
  description?: string
  /** Category badge label (e.g. 'Logistics', 'Revenue') */
  category?: string
  /** Slot for <ReportFilters /> */
  filters?: ReactNode
  /** Slot for <ReportSummaryCards /> */
  summary?: ReactNode
  /** Slot for <ReportTable /> and/or charts */
  children: ReactNode
  /** Export button(s) — rendered in the header right-hand side */
  actions?: ReactNode
  /** Additional className on the root element */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportShell({
  title,
  description,
  category,
  filters,
  summary,
  children,
  actions,
  className,
}: ReportShellProps) {
  const embedded = useContext(EmbeddedReportContext)
  if (embedded) {
    return (
      <div className={cn("space-y-5", className)}>
        {filters && <div className="border-y border-[var(--ra-line)] py-4">{filters}</div>}
        {embedded.pills}
        {embedded.showSummary && summary}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
        <div className="border-t border-[var(--ra-line)]">{children}</div>
      </div>
    )
  }

  const badgeColour =
    category ? (CATEGORY_COLOURS[category.toLowerCase()] ?? CATEGORY_COLOURS.revenue) : undefined

  return (
    <div className={cn("space-y-5", className)}>

      {/* ── Back to Reports Hub ────────────────────────────────────────── */}
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">{title}</h1>
            {category && (
              <Badge variant="outline" className={cn("text-xs font-medium border-0", badgeColour)}>
                {category}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Export button(s) */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      {filters && (
        <Card>
          <CardContent className="pt-5 pb-4">
            {filters}
          </CardContent>
        </Card>
      )}

      {/* ── Summary KPI Cards ────────────────────────────────────────────── */}
      {summary && <div>{summary}</div>}

      {/* ── Main Content (table / charts) ───────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
