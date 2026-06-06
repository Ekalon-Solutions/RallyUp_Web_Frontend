"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ArrowLeft,
  X,
  Clock,
  Info,
  Loader2,
  CircleDot,
  ShieldCheck,
  Settings2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

// ── Types ────────────────────────────────────────────────────────────────────

type BillingAlert = {
  _id: string
  club: { _id: string; name: string; slug: string } | string
  club_name?: string
  alert_type: string
  feature_key?: string
  service_id?: string
  description: string
  severity: "warning" | "critical"
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
  resolved_by_name?: string
  created_at: string
}

// ── Static reference data ────────────────────────────────────────────────────

const ALERT_TYPE_LABELS: Record<string, string> = {
  feature_above_tier:         "Feature Above Tier",
  delinquent_premium_active:  "Delinquent Premium Active",
  trial_expired_still_active: "Trial Expired Active",
  manual_override_delinquent: "Manual Override",
}

const ALERT_TYPE_DESC: Record<string, string> = {
  feature_above_tier:         "A feature is enabled that is not included in the club's paid tier.",
  delinquent_premium_active:  "Billing is delinquent but a premium feature is still active.",
  trial_expired_still_active: "A trial feature expired and was not auto-disabled.",
  manual_override_delinquent: "A feature was manually enabled for a delinquent club.",
}

const ALERT_TYPE_COLOR: Record<string, string> = {
  feature_above_tier:         "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700",
  delinquent_premium_active:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-700",
  trial_expired_still_active: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-700",
  manual_override_delinquent: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-700",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClubName(a: BillingAlert): string {
  if (a.club_name) return a.club_name
  if (typeof a.club === "object" && a.club?.name) return a.club.name
  return "Unknown Club"
}

function getClubSlug(a: BillingAlert): string {
  if (typeof a.club === "object" && a.club?.slug) return a.club.slug
  return ""
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function exactTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AlertTypePill({ type }: { type: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border cursor-help",
            ALERT_TYPE_COLOR[type] ?? "bg-muted text-muted-foreground border-border"
          )}
        >
          {ALERT_TYPE_LABELS[type] ?? type}
          <Info className="h-2.5 w-2.5 opacity-60 shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs">
        {ALERT_TYPE_DESC[type] ?? type}
      </TooltipContent>
    </Tooltip>
  )
}

function SeverityDot({ severity }: { severity: "warning" | "critical" }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0 ring-2",
          severity === "critical"
            ? "bg-red-500 ring-red-500/25"
            : "bg-amber-500 ring-amber-500/25"
        )}
      />
      <span
        className={cn(
          "text-xs font-medium capitalize",
          severity === "critical" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
        )}
      >
        {severity}
      </span>
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-4 transition-all",
        onClick ? "cursor-pointer hover:shadow-sm" : "cursor-default",
        active ? "ring-2 ring-primary ring-offset-1" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", accent)}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
          <p className="text-2xl font-black leading-none">{value}</p>
        </div>
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingAuditorPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [allAlerts,    setAllAlerts]    = useState<BillingAlert[]>([])
  const [loading,      setLoading]      = useState(true)
  const [resolving,    setResolving]    = useState<Set<string>>(new Set())
  const [bulkResolving, setBulkResolving] = useState(false)

  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning">("all")
  const [typeFilter,   setTypeFilter]   = useState("all")
  const [showResolved, setShowResolved] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // ── Data loading ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setSelectedIds(new Set())
    try {
      const res = await apiClient.getBillingAlerts({
        resolved: showResolved,
        limit: 200,
      })
      if (res.success && res.data) {
        setAllAlerts(res.data as BillingAlert[])
        setLastRefreshed(new Date())
      }
    } catch {
      toast.error("Failed to load billing alerts")
    } finally {
      setLoading(false)
    }
  }, [showResolved])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  // ── Client-side filtering ──────────────────────────────────────────────

  const alerts = useMemo(
    () =>
      allAlerts
        .filter((a) => severityFilter === "all" || a.severity === severityFilter)
        .filter((a) => typeFilter   === "all" || a.alert_type === typeFilter)
        // Critical alerts first
        .sort((a, b) => {
          if (a.severity === b.severity) return 0
          return a.severity === "critical" ? -1 : 1
        }),
    [allAlerts, severityFilter, typeFilter]
  )

  // ── Stats ──────────────────────────────────────────────────────────────

  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length
  const warningCount  = allAlerts.filter((a) => a.severity === "warning").length

  // ── Selection ──────────────────────────────────────────────────────────

  const allSelected  = alerts.length > 0 && alerts.every((a) => selectedIds.has(a._id))
  const someSelected = !allSelected && alerts.some((a) => selectedIds.has(a._id))

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(alerts.map((a) => a._id)) : new Set())

  // ── Resolve handlers ───────────────────────────────────────────────────

  const handleResolve = async (alertId: string) => {
    setResolving((prev) => new Set(prev).add(alertId))
    try {
      const res = await apiClient.resolveBillingAlert(alertId)
      if (res.success) {
        toast.success("Alert resolved")
        setAllAlerts((prev) => prev.filter((a) => a._id !== alertId))
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(alertId); return n })
      } else {
        toast.error("Failed to resolve alert")
      }
    } catch {
      toast.error("Failed to resolve alert")
    } finally {
      setResolving((prev) => { const n = new Set(prev); n.delete(alertId); return n })
    }
  }

  const handleBulkResolve = async (ids: string[]) => {
    if (!ids.length) return
    setBulkResolving(true)
    try {
      const results = await Promise.allSettled(
        ids.map((id) => apiClient.resolveBillingAlert(id))
      )
      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value?.success
      ).length
      const failed = results.length - succeeded

      if (succeeded > 0) {
        toast.success(`Resolved ${succeeded} alert${succeeded !== 1 ? "s" : ""}`)
        setAllAlerts((prev) => prev.filter((a) => !ids.includes(a._id)))
        setSelectedIds(new Set())
      }
      if (failed > 0) toast.error(`${failed} failed to resolve`)
    } catch {
      toast.error("Bulk resolve failed")
    } finally {
      setBulkResolving(false)
    }
  }

  // ── Auth guard ─────────────────────────────────────────────────────────

  if (!authLoading && user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Only system owners can access the Billing Auditor.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const hasActiveFilters = severityFilter !== "all" || typeFilter !== "all"
  const selectedArr = Array.from(selectedIds)

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <TooltipProvider delayDuration={200}>
          <div className="p-6 space-y-5 max-w-5xl mx-auto">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2.5">
                  <ShieldAlert className="h-6 w-6 text-red-500 shrink-0" />
                  Billing Auditor
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Flags conflicts between manual feature toggles and paid billing tiers.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lastRefreshed && !loading && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {relativeTime(lastRefreshed.toISOString())}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={load}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                  Refresh
                </Button>
                <Link href="/dashboard/billing-settings">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Settings2 className="h-3 w-3" />
                    Settings
                  </Button>
                </Link>
                <Link href="/dashboard/feature-matrix">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <ArrowLeft className="h-3 w-3" />
                    Service Matrix
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                accent="bg-red-500/10"
                label={showResolved ? "Critical (resolved)" : "Critical open"}
                value={loading ? "—" : criticalCount}
                active={severityFilter === "critical"}
                onClick={() => setSeverityFilter((v) => v === "critical" ? "all" : "critical")}
              />
              <StatCard
                icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                accent="bg-amber-500/10"
                label={showResolved ? "Warnings (resolved)" : "Warnings open"}
                value={loading ? "—" : warningCount}
                active={severityFilter === "warning"}
                onClick={() => setSeverityFilter((v) => v === "warning" ? "all" : "warning")}
              />
              <StatCard
                icon={showResolved
                  ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  : <CircleDot className="h-4 w-4 text-primary" />}
                accent={showResolved ? "bg-emerald-500/10" : "bg-primary/10"}
                label={showResolved ? "Showing resolved" : "Total open"}
                value={loading ? "—" : allAlerts.length}
                active={showResolved}
                onClick={() => { setShowResolved((v) => !v); setSeverityFilter("all") }}
              />
            </div>

            {/* ── Filter toolbar ─────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Select
                value={severityFilter}
                onValueChange={(v) => setSeverityFilter(v as typeof severityFilter)}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"      className="text-xs">All severities</SelectItem>
                  <SelectItem value="critical" className="text-xs">Critical only</SelectItem>
                  <SelectItem value="warning"  className="text-xs">Warnings only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All alert types</SelectItem>
                  {Object.entries(ALERT_TYPE_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => { setSeverityFilter("all"); setTypeFilter("all") }}
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </Button>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {alerts.length} / {allAlerts.length}
                  </Badge>
                </>
              )}

              {/* Resolve-all-visible quick action */}
              {!showResolved && alerts.length > 1 && !loading && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs ml-auto gap-1.5"
                  disabled={bulkResolving}
                  onClick={() => handleBulkResolve(alerts.map((a) => a._id))}
                >
                  {bulkResolving
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <CheckCircle2 className="h-3 w-3" />}
                  Resolve all visible ({alerts.length})
                </Button>
              )}
            </div>

            {/* ── Alert table ────────────────────────────────────────── */}
            <div className="rounded-xl border bg-card overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                  <div className={cn(
                    "h-14 w-14 rounded-full flex items-center justify-center",
                    showResolved ? "bg-muted" : "bg-emerald-500/10"
                  )}>
                    {showResolved
                      ? <ShieldAlert className="h-7 w-7 text-muted-foreground" />
                      : <CheckCircle2 className="h-7 w-7 text-emerald-500" />}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {showResolved ? "No resolved alerts" : "All clear"}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {showResolved
                        ? "No resolved alerts match your current filters."
                        : "No open billing conflicts detected. Check back after the next feature sync."}
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      {!showResolved && (
                        <TableHead className="w-10 pl-4">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                            aria-label="Select all"
                          />
                        </TableHead>
                      )}
                      <TableHead className="min-w-[160px]">Club</TableHead>
                      <TableHead className="min-w-[160px]">Alert type</TableHead>
                      <TableHead className="min-w-[100px]">Feature</TableHead>
                      <TableHead className="min-w-[100px]">Severity</TableHead>
                      <TableHead className="max-w-xs">Description</TableHead>
                      <TableHead className="min-w-[90px]">
                        {showResolved ? "Resolved" : "Raised"}
                      </TableHead>
                      {!showResolved && <TableHead className="w-24 text-right pr-4">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => {
                      const isResolving = resolving.has(alert._id)
                      const isSelected  = selectedIds.has(alert._id)
                      const isCritical  = alert.severity === "critical"
                      return (
                        <TableRow
                          key={alert._id}
                          className={cn(
                            "group transition-colors",
                            isCritical && !showResolved
                              ? "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/60 dark:hover:bg-red-950/20"
                              : "",
                            isSelected ? "bg-primary/[0.03]" : ""
                          )}
                        >
                          {/* Select checkbox */}
                          {!showResolved && (
                            <TableCell className="pl-4">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(alert._id)}
                              />
                            </TableCell>
                          )}

                          {/* Club */}
                          <TableCell className="py-3">
                            <p className="font-medium text-sm leading-none mb-0.5">
                              {getClubName(alert)}
                            </p>
                            {getClubSlug(alert) && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {getClubSlug(alert)}
                              </p>
                            )}
                          </TableCell>

                          {/* Alert type */}
                          <TableCell className="py-3">
                            <AlertTypePill type={alert.alert_type} />
                          </TableCell>

                          {/* Feature key */}
                          <TableCell className="py-3">
                            {alert.feature_key || alert.service_id ? (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                {alert.feature_key ?? alert.service_id}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Severity */}
                          <TableCell className="py-3">
                            <SeverityDot severity={alert.severity} />
                          </TableCell>

                          {/* Description */}
                          <TableCell className="py-3 max-w-xs">
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {alert.description}
                            </p>
                          </TableCell>

                          {/* Raised / Resolved timestamp */}
                          <TableCell className="py-3">
                            {showResolved && alert.resolved_at ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-muted-foreground cursor-default">
                                    <p>{relativeTime(alert.resolved_at)}</p>
                                    {alert.resolved_by_name && (
                                      <p className="text-[10px]">by {alert.resolved_by_name}</p>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {exactTime(alert.resolved_at)}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground cursor-default">
                                    {relativeTime(alert.created_at)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {exactTime(alert.created_at)}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>

                          {/* Resolve action */}
                          {!showResolved && (
                            <TableCell className="text-right pr-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                                disabled={isResolving || bulkResolving}
                                onClick={() => handleResolve(alert._id)}
                              >
                                {isResolving
                                  ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  : <CheckCircle2 className="h-2.5 w-2.5" />}
                                Resolve
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

          </div>

          {/* ── Floating bulk-resolve bar ──────────────────────────────── */}
          {selectedArr.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <div className="flex items-center gap-3 bg-background border rounded-xl shadow-xl px-4 py-2.5">
                <span className="text-sm font-medium">
                  {selectedArr.length} alert{selectedArr.length !== 1 ? "s" : ""} selected
                </span>
                <div className="h-4 w-px bg-border" />
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  disabled={bulkResolving}
                  onClick={() => handleBulkResolve(selectedArr)}
                >
                  {bulkResolving
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <CheckCircle2 className="h-3 w-3" />}
                  Resolve selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </TooltipProvider>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
