"use client"

/**
 * ReportSummaryCards — KPI summary card grid.
 *
 * Displays an array of SummaryCard objects as a responsive grid of metric cards.
 * Mirrors the KPI card layout used in app/dashboard/vendor-reports/page.tsx
 * but generalised to accept any metric set.
 *
 * Each card shows:
 *   - A metric label
 *   - A formatted value
 *   - An optional sub-label (e.g. "vs last month")
 *   - An optional % change indicator (green = positive, red = negative)
 */

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SummaryCard } from "./types"

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportSummaryCardsProps {
  cards: SummaryCard[]
  loading?: boolean
  /** Number of columns in the grid at lg breakpoint (default: 4) */
  cols?: 2 | 3 | 4 | 5
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportSummaryCards({
  cards,
  loading = false,
  cols = 4,
}: ReportSummaryCardsProps) {
  const gridClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  }[cols]

  if (loading) {
    return (
      <div className={cn("grid gap-4", gridClass)}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4", gridClass)}>
      {cards.map((card, index) => {
        const hasChange = card.change !== undefined && card.change !== null
        const isPositive = (card.change ?? 0) >= 0

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight leading-none">
                  {card.value}
                </p>

                {/* Sub-label or change indicator */}
                {(card.subLabel || hasChange) && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    {hasChange && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-medium",
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500 dark:text-red-400",
                        )}
                      >
                        {isPositive
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(card.change!).toFixed(1)}%
                      </span>
                    )}
                    {card.subLabel && (
                      <span className="text-xs text-muted-foreground">
                        {card.subLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
