"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, ShieldAlert, AlertTriangle, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { buildReportQueryParams, shouldFetchReport } from "@/lib/reportHelpers"
import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  AccessDeniedPage,
  ReportShell,
  ReportTable,
  ReportSummaryCards,
  ExportButton,
  ReportFilters,
  type ReportColumn,
  type SummaryCard,
  type ReportFiltersState,
  type ReportPaginationMeta,
  type ExportFormat,
  SystemOwnerClubFilter,
} from "@/components/reports"

// ─── Risk Level Badge Component ───────────────────────────────────────────────

function renderRiskBadge(riskLevel: string) {
  const level = (riskLevel || "").toLowerCase()
  switch (level) {
    case "high":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">High</Badge>
    case "medium":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Medium</Badge>
    case "low":
    default:
      return <Badge variant="outline" className="text-muted-foreground font-normal">Low</Badge>
  }
}

// ─── Row Interface ────────────────────────────────────────────────────────────

interface AdminAuditLogRow extends Record<string, unknown> {
  id: string
  timestamp: string
  actorName: string
  actorType: string
  actorId: string
  action: string
  targetId: string | null
  targetType: string | null
  riskLevel: "low" | "medium" | "high"
  ipAddress: string
  device: string
  summary: string
  clubId: string
  clubName: string
}

interface ActionOption {
  value: string
  label: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAuditLogReportPage() {
  const auth = useReportAuthorization("admin-audit")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminAuditLogRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalActions: 0,
    criticalActions: 0,
    highRiskActions: 0,
    uniqueAdmins: 0,
  })
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([])

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: {
      actorType: "all",
      action: "all",
      riskLevel: "all",
    },
  })

  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "createdAt",
    direction: "desc",
  })

  const [page, setPage] = useState(1)

  // ── Fetch Report Data ───────────────────────────────────────────────────────

  const fetchReport = useCallback(async () => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    setLoading(true)
    try {
      const queryParams = buildReportQueryParams({
        clubId,
        selectedClubId,
        isSystemOwner,
        page,
        sort,
        filters,
      })

      if (filters.extras?.actorType && filters.extras.actorType !== "all") {
        queryParams.actorType = filters.extras.actorType
      }
      if (filters.extras?.action && filters.extras.action !== "all") {
        queryParams.action = filters.extras.action
      }
      if (filters.extras?.riskLevel && filters.extras.riskLevel !== "all") {
        queryParams.riskLevel = filters.extras.riskLevel
      }

      const res = await apiClient.getAdminAuditLogReport(queryParams)
      if (res.success && res.data) {
        setData(res.data.data)
        if (res.data.meta?.pagination) {
          setPagination(res.data.meta.pagination)
        }
        if (res.data.summary) {
          setSummaryData({
            totalActions: Number(res.data.summary.totalActions) || 0,
            criticalActions: Number(res.data.summary.criticalActions) || 0,
            highRiskActions: Number(res.data.summary.highRiskActions) || 0,
            uniqueAdmins: Number(res.data.summary.uniqueAdmins) || 0,
          })
          if (res.data.summary.actionOptions) {
            try {
              const parsedActions = typeof res.data.summary.actionOptions === "string"
                ? JSON.parse(res.data.summary.actionOptions)
                : res.data.summary.actionOptions
              if (Array.isArray(parsedActions)) setActionOptions(parsedActions)
            } catch {
              // Ignore action parse errors
            }
          }
        }
      } else {
        toast.error(res.message || "Failed to load admin audit log")
        setData([])
      }
    } catch {
      toast.error("Error loading admin audit log report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clubId, selectedClubId, isSystemOwner, page, sort, filters, auth.authorized])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleApplyFilters = (newFilters: ReportFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      extras: {
        actorType: "all",
        action: "all",
        riskLevel: "all",
      },
    })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = {
        clubId,
        format,
      }
      if (filters.extras?.actorType && filters.extras.actorType !== "all") {
        queryParams.actorType = filters.extras.actorType
      }
      if (filters.extras?.action && filters.extras.action !== "all") {
        queryParams.action = filters.extras.action
      }
      if (filters.extras?.riskLevel && filters.extras.riskLevel !== "all") {
        queryParams.riskLevel = filters.extras.riskLevel
      }

      const res = await apiClient.downloadAdminAuditLogReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Admin Audit Log as ${format.toUpperCase()}`)
      }
    } catch {
      toast.error("Export failed")
    }
  }

  // ── Access & Feature Guards ─────────────────────────────────────────────────

  if (!auth.authorized) {
    return (
      <DashboardLayout>
        <AccessDeniedPage reason={auth.reason} message={auth.message} />
      </DashboardLayout>
    )
  }

  // ── Column Definitions ──────────────────────────────────────────────────────

  const columns: ReportColumn<AdminAuditLogRow>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.timestamp ? row.timestamp.replace("T", " ").slice(0, 19) : "—"}
        </span>
      ),
      sortable: true,
      width: "w-44",
    },
    {
      key: "actorName",
      header: "Admin / Actor",
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{row.actorName}</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {row.actorType}
          </span>
        </div>
      ),
      sortable: true,
      width: "w-48",
    },
    {
      key: "action",
      header: "Action",
      accessor: (row) => (
        <code className="text-xs bg-muted/60 px-2 py-0.5 rounded font-mono font-medium text-foreground">
          {row.action}
        </code>
      ),
      sortable: true,
      width: "w-52",
    },
    {
      key: "targetType",
      header: "Target",
      accessor: (row) => (
        <div className="text-xs">
          {row.targetType ? (
            <span>
              <span className="font-medium capitalize">{row.targetType}</span>
              {row.targetId && (
                <span className="text-muted-foreground font-mono text-[11px] ml-1">
                  ({row.targetId.slice(-6)})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </div>
      ),
      width: "w-36",
    },
    {
      key: "riskLevel",
      header: "Risk Level",
      accessor: (row) => renderRiskBadge(row.riskLevel),
      sortable: true,
      width: "w-28",
    },
    {
      key: "ipAddress",
      header: "IP Address",
      accessor: (row) => <span className="font-mono text-xs text-muted-foreground">{row.ipAddress}</span>,
      width: "w-32",
    },
    {
      key: "summary",
      header: "Summary / Details",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-full block" title={row.summary}>
          {row.summary}
        </span>
      ),
      width: "w-64",
    },
  ]

  // ── Summary Cards Config ────────────────────────────────────────────────────

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Actions",
      value: summaryData.totalActions.toLocaleString(),
    },
    {
      label: "High Risk Actions",
      value: summaryData.highRiskActions.toLocaleString(),
    },
    {
      label: "Critical Events",
      value: summaryData.criticalActions.toLocaleString(),
    },
    {
      label: "Active Admins",
      value: summaryData.uniqueAdmins.toLocaleString(),
    },
  ]

  const actorTypeOptions = [
    { value: "admin", label: "Admin" },
    { value: "system_owner", label: "System Owner" },
    { value: "user", label: "User" },
  ]

  const riskLevelOptions = [
    { value: "high", label: "High Risk" },
    { value: "medium", label: "Medium Risk" },
    { value: "low", label: "Low Risk" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Admin Audit Log"
        description="Immutable audit log tracking all administrative actions, permissions updates, and high-risk events."
        category="Governance"
        actions={
          <ExportButton
            onExport={handleExport}
            disabled={loading || data.length === 0}
          />
        }
        filters={
          <>
            {isSystemOwner && (
              <SystemOwnerClubFilter
                selectedClubId={selectedClubId}
                onChange={setSelectedClubId}
              />
            )}
              <ReportFilters
              initialFilters={filters}
            searchPlaceholder="Search by admin name, action, IP, summary..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {/* Custom Extra Filter: Actor Type Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Actor Type</Label>
              <Select
                value={filters.extras?.actorType || "all"}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    extras: { ...prev.extras, actorType: val },
                  }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Actors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  {actorTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Extra Filter: Risk Level Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Risk Level</Label>
              <Select
                value={filters.extras?.riskLevel || "all"}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    extras: { ...prev.extras, riskLevel: val },
                  }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  {riskLevelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Extra Filter: Action Dropdown */}
            {actionOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Action Type</Label>
                <Select
                  value={filters.extras?.action || "all"}
                  onValueChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      extras: { ...prev.extras, action: val },
                    }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionOptions.map((act) => (
                      <SelectItem key={act.value} value={act.value}>
                        {act.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </ReportFilters>
          </>
        }
        summary={<ReportSummaryCards cards={summaryCards} loading={loading} />}
      >
        <ReportTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          sort={sort}
          onSortChange={setSort}
          onPageChange={setPage}
          emptyMessage="No admin action audit logs found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
