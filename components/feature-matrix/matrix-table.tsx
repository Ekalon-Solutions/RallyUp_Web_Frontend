"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Settings2, Loader2, AlertTriangle, FlaskConical, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CLUB_FEATURE_KEYS } from "@/lib/clubFeatures"

// ── Types ────────────────────────────────────────────────────────────────────

export type MatrixClub = {
  clubId: string
  name: string
  slug: string
  status: string
  billing_tier: string
  billing_status: string
  /** Null-safe: individual flags may be absent in legacy documents; treat missing as false. */
  flags: Array<{ key: string; enabled: boolean; state: string; label: string }>
  estimated_monthly_usd: number
  /** Per-feature usage caps — e.g. max_merch_items: 50. Empty map on legacy docs. */
  feature_constraints: Record<string, number>
  /** Schema version; increments when new experimental flags are added without a migration. */
  features_schema_version: number
  experimental_flags: Record<string, { enabled: boolean; state: string }>
  platformFeePercent: number
}

// ── Layout constants ──────────────────────────────────────────────────────────
// Shared grid-template-columns used by both the sticky header and every virtual row.
// Changing this one constant keeps header and body columns in sync.
const COL_TEMPLATE = "40px 1.5fr 1fr 1fr 1.5fr 1fr 0.8fr 76px"
const ROW_H        = 58   // px — must match the estimateSize below

// ── Style maps ────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  free:       "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400",
  starter:    "border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-400",
  pro:        "border-violet-300 text-violet-600 dark:border-violet-800 dark:text-violet-400",
  enterprise: "border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-400",
}

const STATUS_COLOR: Record<string, string> = {
  active:     "text-emerald-600 dark:text-emerald-400",
  trial:      "text-amber-600 dark:text-amber-400",
  delinquent: "text-red-600 dark:text-red-400",
  cancelled:  "text-muted-foreground line-through",
  paused:     "text-orange-600 dark:text-orange-400",
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  clubs: MatrixClub[]
  selectedIds: string[]
  loading: boolean
  onEdit: (club: MatrixClub) => void
  onSelect: (clubId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
}

// ── Helper components ─────────────────────────────────────────────────────────

function ColHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center text-xs font-semibold text-muted-foreground select-none px-2 py-0",
        className
      )}
    >
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MatrixTable({
  clubs,
  selectedIds,
  loading,
  onEdit,
  onSelect,
  onSelectAll,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Virtual rows — only DOM nodes for visible rows + overscan are created
  const virtualizer = useVirtualizer({
    count:           clubs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize:    () => ROW_H,
    overscan:        8,
  })

  // ── Per-club derived data ───────────────────────────────────────────────

  const featureSummary = (club: MatrixClub) => {
    const total   = CLUB_FEATURE_KEYS.length
    // Null-safe: absent keys default to false (legacy document safety)
    const enabled = CLUB_FEATURE_KEYS.filter(
      (k) => club.flags.find((f) => f.key === k)?.enabled ?? false
    ).length
    return { enabled, total, pct: enabled / total }
  }

  const zeroLimits = (club: MatrixClub) =>
    Object.entries(club.feature_constraints ?? {})
      .filter(([, v]) => v === 0)
      .map(([k]) => k.replace("max_", "").replace(/_/g, " "))

  const initials = (name: string) =>
    name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"

  const allSelected  = clubs.length > 0 && clubs.every((c) => selectedIds.includes(c.clubId))
  const someSelected = !allSelected && clubs.some((c) => selectedIds.includes(c.clubId))

  // Container height: fill viewport when there's lots of data, shrink otherwise
  const containerH = loading || clubs.length === 0
    ? 260
    : Math.min(clubs.length * ROW_H + 2, 620) // cap at 620px, +2 for borders

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* ── Mobile card list ─────────────────────────────────────────── */}
      <div className="md:hidden">
        {!loading && clubs.length > 0 && (
          <div className="border-b bg-muted/40 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => onSelectAll(Boolean(v))}
                aria-label="Select all visible clubs"
              />
              <span className="text-xs font-semibold text-muted-foreground">
                Clubs ({clubs.length})
              </span>
            </div>
            {selectedIds.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{selectedIds.length} selected</span>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No clubs found
          </div>
        ) : (
          <div className="divide-y max-h-[70vh] overflow-y-auto">
            {clubs.map((club) => {
              const { enabled, total, pct } = featureSummary(club)
              const limits = zeroLimits(club)
              const hasExp = Object.keys(club.experimental_flags ?? {}).length > 0
              const isSelected = selectedIds.includes(club.clubId)
              return (
                <div
                  key={club.clubId}
                  className={cn(
                    "p-4 space-y-3",
                    isSelected ? "bg-primary/[0.04]" : ""
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => onSelect(club.clubId, Boolean(v))}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials(club.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{club.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{club.slug}</p>
                        </div>
                        {hasExp && <FlaskConical className="h-3 w-3 text-amber-500 shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize px-2 py-0.5 font-semibold",
                            TIER_BADGE[club.billing_tier] ?? TIER_BADGE.free
                          )}
                        >
                          {club.billing_tier}
                        </Badge>
                        <span
                          className={cn(
                            "text-xs capitalize font-medium",
                            STATUS_COLOR[club.billing_status] ?? "text-muted-foreground"
                          )}
                        >
                          {club.billing_status}
                        </span>
                        <span className="text-xs font-mono">
                          {club.platformFeePercent ?? 5}% fee
                        </span>
                        <span className="text-xs font-mono ml-auto">
                          ₹{club.estimated_monthly_usd.toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-1.5 rounded-full",
                              pct >= 0.8 ? "bg-emerald-500" : pct >= 0.4 ? "bg-amber-500" : "bg-red-400"
                            )}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{enabled}/{total}</span>
                      </div>
                      {limits.length > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {limits.length} zero-limit{limits.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs gap-1.5"
                    onClick={() => onEdit(club)}
                  >
                    <Settings2 className="h-3 w-3" />
                    Edit features
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Desktop table (min-width wrapper for horizontal scroll) ──── */}
      <div className="hidden md:block overflow-x-auto">
      <div className="min-w-[700px]">

        {/* ── Sticky header (outside the virtualised scroll area) ──────── */}
        <div
          className="border-b bg-muted/40"
          style={{ display: "grid", gridTemplateColumns: COL_TEMPLATE }}
        >
          <div className="flex items-center justify-center py-2.5 pl-1">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(v) => onSelectAll(Boolean(v))}
              aria-label="Select all visible clubs"
            />
          </div>
          <ColHeader>
            Club
            <span className="ml-1.5 font-normal text-muted-foreground/60">
              ({clubs.length})
            </span>
          </ColHeader>
          <ColHeader>Tier</ColHeader>
          <ColHeader>Billing</ColHeader>
          <ColHeader className="gap-1">
            Features
            <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
          </ColHeader>
          <ColHeader className="justify-center">Platform Fees</ColHeader>
          <ColHeader className="justify-end pr-4">₹/mo</ColHeader>
          <div />
        </div>

        {/* ── Virtualised scroll body ──────────────────────────────────── */}
        <div
          ref={scrollRef}
          style={{ height: containerH, overflowY: "auto" }}
          className="relative"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : clubs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No clubs found
            </div>
          ) : (
            // Outer div holds the total height; each row is absolutely placed inside it
            <div
              style={{
                height:   virtualizer.getTotalSize(),
                width:    "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((vItem) => {
                const club        = clubs[vItem.index]
                const { enabled, total, pct } = featureSummary(club)
                const limits      = zeroLimits(club)
                const hasExp      = Object.keys(club.experimental_flags ?? {}).length > 0
                const isSelected  = selectedIds.includes(club.clubId)

                return (
                  <div
                    key={club.clubId}
                    data-index={vItem.index}
                    style={{
                      position:  "absolute",
                      top:       0,
                      left:      0,
                      width:     "100%",
                      height:    `${vItem.size}px`,
                      transform: `translateY(${vItem.start}px)`,
                      display:   "grid",
                      gridTemplateColumns: COL_TEMPLATE,
                    }}
                    className={cn(
                      "group border-b items-center transition-colors last:border-0",
                      isSelected
                        ? "bg-primary/[0.04] hover:bg-primary/[0.06]"
                        : "hover:bg-muted/40"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center justify-center pl-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => onSelect(club.clubId, Boolean(v))}
                      />
                    </div>

                    {/* Club identity */}
                    <div className="flex items-center gap-2.5 px-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 select-none">
                        {initials(club.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate leading-none mb-0.5">
                          {club.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {club.slug}
                        </p>
                      </div>
                      {hasExp && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FlaskConical className="h-3 w-3 text-amber-500 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Has experimental flags
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Tier */}
                    <div className="px-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize px-2 py-0.5 font-semibold",
                            TIER_BADGE[club.billing_tier] ?? TIER_BADGE.free
                          )}
                        >
                          {club.billing_tier}
                        </Badge>
                        {(club.features_schema_version ?? 0) > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[9px] text-muted-foreground/50 font-mono cursor-default">
                                v{club.features_schema_version}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Schema version {club.features_schema_version}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Billing status */}
                    <div className="px-2">
                      <span
                        className={cn(
                          "text-xs capitalize font-medium",
                          STATUS_COLOR[club.billing_status] ?? "text-muted-foreground"
                        )}
                      >
                        {club.billing_status}
                      </span>
                    </div>

                    {/* Feature health bar */}
                    <div className="px-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[88px] overflow-hidden">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              pct >= 0.8
                                ? "bg-emerald-500"
                                : pct >= 0.4
                                ? "bg-amber-500"
                                : "bg-red-400"
                            )}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {enabled}/{total}
                        </span>
                      </div>
                      {limits.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 cursor-help w-fit">
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                              <span>{limits.length} zero-limit{limits.length > 1 ? "s" : ""}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                            <p className="font-semibold mb-1">Constraints set to 0</p>
                            {limits.map((w) => <p key={w} className="capitalize">· {w}</p>)}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Platform fee */}
                    <div className="text-center text-xs font-mono">
                      {club.platformFeePercent ?? 5}%
                    </div>

                    {/* MRR */}
                    <div className="text-right text-xs font-mono pr-4">
                      ₹{club.estimated_monthly_usd.toLocaleString()}
                    </div>

                    {/* Edit action */}
                    <div className="flex items-center justify-end pr-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2.5 text-xs gap-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                        onClick={() => onEdit(club)}
                      >
                        <Settings2 className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer — row count + virtual-scroll callout ───────────────── */}
        {!loading && clubs.length > 0 && (
          <div className="border-t bg-muted/20 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {selectedIds.length > 0
                ? `${selectedIds.length} of ${clubs.length} selected`
                : `${clubs.length} club${clubs.length !== 1 ? "s" : ""}`}
            </span>
            <span className="hidden sm:block">
              Scroll to see all · rendering {Math.min(virtualizer.getVirtualItems().length, clubs.length)} of {clubs.length} rows
            </span>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
