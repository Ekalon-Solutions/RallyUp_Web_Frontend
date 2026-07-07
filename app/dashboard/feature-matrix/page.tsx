"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertTriangle,
  Grid3X3,
  LockKeyhole,
  Search,
  TrendingUp,
  Building2,
  X,
  Target,
  IndianRupee,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { MatrixTable, type MatrixClub } from "@/components/feature-matrix/matrix-table"
import { BulkFeaturePanel } from "@/components/feature-matrix/bulk-feature-panel"
import { ClubFeatureSheet } from "@/components/feature-matrix/club-feature-sheet"
import { CohortActionDialog } from "@/components/feature-matrix/cohort-action-dialog"

const SESSION_LOCK_MS = 15 * 60 * 1000

export default function FeatureMatrixPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [search,       setSearch]       = useState("")
  const [tierFilter,   setTierFilter]   = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [clubs,    setClubs]    = useState<MatrixClub[]>([])
  const [tooltips, setTooltips] = useState<Record<string, string>>({})
  const [labels,   setLabels]   = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState(true)

  const [selectedIds,    setSelectedIds]    = useState<string[]>([])
  const [bulkTier,       setBulkTier]       = useState("pro")
  const [locked,         setLocked]         = useState(false)
  const [alertCount,     setAlertCount]     = useState(0)
  const [editingClub,    setEditingClub]    = useState<MatrixClub | null>(null)
  const [cohortOpen,     setCohortOpen]     = useState(false)

  const lastActiveRef = useRef(Date.now())

  // ── Inactivity session lock ──────────────────────────────────────────────

  const touchActivity = useCallback(() => {
    lastActiveRef.current = Date.now()
    setLocked(false)
  }, [])

  useEffect(() => {
    const onActivity = () => { lastActiveRef.current = Date.now(); setLocked(false) }
    window.addEventListener("mousemove", onActivity)
    window.addEventListener("keydown",   onActivity)
    window.addEventListener("click",     onActivity)
    const id = setInterval(() => {
      if (Date.now() - lastActiveRef.current > SESSION_LOCK_MS) setLocked(true)
    }, 30_000)
    return () => {
      clearInterval(id)
      window.removeEventListener("mousemove", onActivity)
      window.removeEventListener("keydown",   onActivity)
      window.removeEventListener("click",     onActivity)
    }
  }, [])

  // ── Data loading ─────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getClubFeatureMatrix(search.trim() || undefined)
      if (res.success && res.data) {
        setClubs(
          (res.data.clubs as MatrixClub[]).map((club) => ({
            ...club,
            // Null-safe defaults — handles legacy documents that predate these fields
            flags:                    Array.isArray(club.flags) ? club.flags : [],
            feature_constraints:      club.feature_constraints      ?? {},
            features_schema_version:  club.features_schema_version  ?? 0,
            experimental_flags:       club.experimental_flags       ?? {},
            platformFeePercent:       club.platformFeePercent       ?? 5,
          }))
        )
        setTooltips(res.data.tooltips || {})
        setLabels(res.data.labels    || {})
      }
    } catch {
      toast.error("Failed to load service matrix")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    apiClient.getBillingAlertCount()
      .then((res) => { if (res.success && res.data) setAlertCount((res.data as any).count ?? 0) })
      .catch(() => {})
  }, [])

  // ── Derived / filtered data ──────────────────────────────────────────────

  const filteredClubs = clubs.filter((c) => {
    if (tierFilter   !== "all" && c.billing_tier   !== tierFilter)   return false
    if (statusFilter !== "all" && c.billing_status !== statusFilter) return false
    return true
  })

  const totalMRR       = clubs.reduce((s, c) => s + (c.estimated_monthly_usd ?? 0), 0)
  const trialCount     = clubs.filter((c) => c.billing_status === "trial").length
  const delinquentCount = clubs.filter((c) => c.billing_status === "delinquent").length
  const hasActiveFilters = tierFilter !== "all" || statusFilter !== "all" || search !== ""

  // ── Selection handlers ───────────────────────────────────────────────────

  const handleSelect = (clubId: string, checked: boolean) =>
    setSelectedIds((ids) => checked ? [...ids, clubId] : ids.filter((id) => id !== clubId))

  // Selects / deselects all clubs currently visible (after filters)
  const handleSelectAll = (checked: boolean) => {
    const visibleIds = filteredClubs.map((c) => c.clubId)
    setSelectedIds((ids) => {
      if (checked) return [...new Set([...ids, ...visibleIds])]
      return ids.filter((id) => !visibleIds.includes(id))
    })
  }

  // ── Access guard (waits for auth to resolve before showing wall) ─────────

  if (!authLoading && user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Only system owners can access the Service Matrix.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <TooltipProvider delayDuration={200}>

          {/* Session lock overlay */}
          {locked && (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 p-8">
              <div className="rounded-full bg-muted p-5">
                <LockKeyhole className="h-9 w-9 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">Session locked</h2>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  The Service Matrix locked after 15 minutes of inactivity to prevent
                  unauthorised changes on an unattended screen.
                </p>
              </div>
              <Button onClick={touchActivity}>Unlock</Button>
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">

            {/* ── Page header ───────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                  <Grid3X3 className="h-6 w-6 text-primary shrink-0" />
                  Service Matrix
                </h1>
                <p className="text-muted-foreground text-sm mt-1 max-w-lg">
                  Manage club modules, billing tiers, feature limits, and experimental flags.
                  Changes are applied atomically. Session auto-locks after 15 min.
                </p>
              </div>
              <Link href="/dashboard/billing-auditor" className="w-full sm:w-auto">
                <div
                  className={`flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium rounded-xl px-3.5 py-2 cursor-pointer transition-colors w-full sm:w-auto ${
                    alertCount > 0
                      ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {alertCount > 0
                      ? `${alertCount} billing alert${alertCount !== 1 ? "s" : ""}`
                      : "No alerts"}
                  </span>
                </div>
              </Link>
            </div>

            {/* ── Stats row ─────────────────────────────────────────── */}
            {!loading && clubs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: <Building2 className="h-4 w-4 text-primary" />,
                    bg: "bg-primary/10",
                    label: "Total clubs",
                    value: clubs.length.toString(),
                  },
                  {
                    icon: <IndianRupee className="h-4 w-4 text-emerald-600" />,
                    bg: "bg-emerald-500/10",
                    label: "Monthly revenue",
                    value: `₹${totalMRR.toLocaleString()}`,
                  },
                  {
                    icon: <TrendingUp className="h-4 w-4 text-amber-600" />,
                    bg: "bg-amber-500/10",
                    label: "On trial",
                    value: trialCount.toString(),
                  },
                  {
                    icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
                    bg: "bg-red-500/10",
                    label: "Delinquent",
                    value: delinquentCount.toString(),
                  },
                ].map(({ icon, bg, label, value }) => (
                  <Card key={label}>
                    <CardContent className="p-3.5 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
                        <p className="text-xl font-bold leading-none">{value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Search & filters ──────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 h-9"
                  placeholder="Search by name, slug, or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs">
                  <SelectValue placeholder="All tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"        className="text-xs">All tiers</SelectItem>
                  <SelectItem value="free"        className="text-xs capitalize">Free</SelectItem>
                  <SelectItem value="starter"     className="text-xs capitalize">Starter</SelectItem>
                  <SelectItem value="pro"         className="text-xs capitalize">Pro</SelectItem>
                  <SelectItem value="enterprise"  className="text-xs capitalize">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"         className="text-xs">All statuses</SelectItem>
                  <SelectItem value="active"      className="text-xs capitalize">Active</SelectItem>
                  <SelectItem value="trial"       className="text-xs capitalize">Trial</SelectItem>
                  <SelectItem value="delinquent"  className="text-xs capitalize">Delinquent</SelectItem>
                  <SelectItem value="cancelled"   className="text-xs capitalize">Cancelled</SelectItem>
                  <SelectItem value="paused"      className="text-xs capitalize">Paused</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs gap-1.5"
                    onClick={() => { setSearch(""); setTierFilter("all"); setStatusFilter("all") }}
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                  {(tierFilter !== "all" || statusFilter !== "all") && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {filteredClubs.length} / {clubs.length}
                    </Badge>
                  )}
                </>
              )}

              {/* Cohort targeting — lives in the toolbar, independent of selection */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 w-full sm:w-auto sm:ml-auto"
                onClick={() => setCohortOpen(true)}
              >
                <Target className="h-3.5 w-3.5" />
                Target cohort
              </Button>
            </div>

            {/* ── Bulk action panel — only while clubs are selected ─── */}
            {selectedIds.length > 0 && (
              <BulkFeaturePanel
                selectedIds={selectedIds}
                labels={labels}
                bulkTier={bulkTier}
                setBulkTier={setBulkTier}
                onApplied={load}
                onClearSelection={() => setSelectedIds([])}
                onOpenCohortDialog={() => setCohortOpen(true)}
              />
            )}

            {/* ── Main table ────────────────────────────────────────── */}
            <MatrixTable
              clubs={filteredClubs}
              selectedIds={selectedIds}
              loading={loading}
              onEdit={setEditingClub}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
            />

            {/* ── Legend ────────────────────────────────────────────── */}
            {!loading && clubs.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5 text-xs text-muted-foreground border-t pt-4">
                <span className="font-medium text-foreground/60 uppercase tracking-wide text-[10px] w-full sm:w-auto">
                  Feature health
                </span>
                {[
                  ["bg-emerald-500", "≥ 80% enabled"],
                  ["bg-amber-500",   "40–79% enabled"],
                  ["bg-red-400",     "< 40% enabled"],
                ].map(([color, label]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    {label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto text-[10px]">
                  Tap <span className="font-medium text-foreground">Edit</span> on
                  any club to open the feature editor.
                </span>
              </div>
            )}
          </div>
        </TooltipProvider>

        {/* Club feature editor sheet */}
        <ClubFeatureSheet
          club={editingClub}
          labels={labels}
          tooltips={tooltips}
          onClose={() => setEditingClub(null)}
          onSaved={() => { setEditingClub(null); load() }}
        />

        {/* Cohort bulk-toggle dialog — works over ALL loaded clubs regardless of current filters */}
        <CohortActionDialog
          open={cohortOpen}
          onClose={() => setCohortOpen(false)}
          onApplied={() => { setCohortOpen(false); load() }}
          allClubs={clubs}
          labels={labels}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
