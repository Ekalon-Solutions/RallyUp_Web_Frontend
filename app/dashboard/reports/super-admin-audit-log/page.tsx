"use client"

import { useCallback, useEffect, useState } from "react"
import { Shield, AlertTriangle, Users, Building2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
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

function renderRiskLevelBadge(level: string) {
  const l = (level || "").toLowerCase()
  if (l === "critical") {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-0 font-medium">Critical</Badge>
  }
  if (l === "high") {
    return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-0 font-medium">High</Badge>
  }
  if (l === "medium") {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Medium</Badge>
  }
  if (l === "low") {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Low</Badge>
  }
  return <Badge variant="outline">{level}</Badge>
}

interface SuperAdminAuditLogRow extends Record<string, unknown> {
  id: string
  timestamp: string
  actorName: string
  actorType: string
  actorId: string
  action: string
  targetClubId: string | null
  targetClubName: string | null
  targetId: string | null
  targetType: string | null
  riskLevel: string
  ipAddress: string
  device: string
  summary: string
  oldState: string
  newState: string
}

export default function SuperAdminAuditLogReportPage() {
  const auth = useReportAuthorization("super-admin-audit-log")

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SuperAdminAuditLogRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalActions: 0,
    criticalActions: 0,
    highRiskActions: 0,
    uniqueActors: 0,
    affectedClubs: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
  })

  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "createdAt",
    direction: "desc",
  })

  const [page, setPage] = useState(1)

  const fetchReport = useCallback(async () => {
    if (!auth.authorized) return
    setLoading(true)
    try {
      const queryParams: Record<string, any> = {
        page,
        limit: 20,
        sortBy: sort.field,
        sortDir: sort.direction,
      }

      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status && filters.status !== "all") queryParams.riskLevel = filters.status

      const res = await apiClient.getSuperAdminAuditLogReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalActions: Number(res.data.summary.totalActions) || 0,
            criticalActions: Number(res.data.summary.criticalActions) || 0,
            highRiskActions: Number(res.data.summary.highRiskActions) || 0,
            uniqueActors: Number(res.data.summary.uniqueActors) || 0,
            affectedClubs: Number(res.data.summary.affectedClubs) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load Super Admin Audit Log report")
        setData([])
      }
    } catch {
      toast.error("Error loading Super Admin Audit Log report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [page, sort, filters, auth.authorized])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleApplyFilters = (newFilters: ReportFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!auth.authorized) return
    try {
      const queryParams: Record<string, any> = { format }
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status && filters.status !== "all") queryParams.riskLevel = filters.status

      const res = await apiClient.downloadSuperAdminAuditLogReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Super Admin Audit Log as ${format.toUpperCase()}`)
      }
    } catch {
      toast.error("Export failed")
    }
  }

  if (!auth.authorized) {
    return (
      <DashboardLayout>
        <AccessDeniedPage reason={auth.reason} message={auth.message} />
      </DashboardLayout>
    )
  }

  const columns: ReportColumn<SuperAdminAuditLogRow>[] = [
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
      header: "System Owner",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.actorName}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{row.actorId.slice(0, 12)}...</div>
        </div>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "action",
      header: "Action",
      accessor: (row) => (
        <div className="text-xs font-medium max-w-[180px] truncate" title={row.action}>
          {row.action.replace(/_/g, " ")}
        </div>
      ),
      sortable: true,
      width: "w-44",
    },
    {
      key: "targetClubName",
      header: "Target Club",
      accessor: (row) => (
        row.targetClubName ? (
          <div>
            <div className="text-xs font-medium">{row.targetClubName}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {row.targetClubId?.slice(0, 12)}...
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">System-wide</span>
        )
      ),
      width: "w-44",
    },
    {
      key: "riskLevel",
      header: "Risk",
      accessor: (row) => renderRiskLevelBadge(row.riskLevel),
      sortable: true,
      width: "w-28",
    },
    {
      key: "ipAddress",
      header: "IP / Device",
      accessor: (row) => (
        <div>
          <div className="font-mono text-[10px]">{row.ipAddress}</div>
          <div className="text-[9px] text-muted-foreground truncate max-w-full" title={row.device}>
            {row.device}
          </div>
        </div>
      ),
      width: "w-36",
    },
    {
      key: "summary",
      header: "Summary",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-full block" title={row.summary}>
          {row.summary}
        </span>
      ),
      width: "w-60",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Actions",
      value: summaryData.totalActions.toLocaleString(),
    },
    {
      label: "Critical Actions",
      value: summaryData.criticalActions.toLocaleString(),
    },
    {
      label: "Unique System Owners",
      value: summaryData.uniqueActors.toLocaleString(),
    },
    {
      label: "Affected Clubs",
      value: summaryData.affectedClubs.toLocaleString(),
    },
  ]

  const riskLevelOptions = [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Super Admin Audit Log"
        description="Cross-tenant audit trail for system owner actions, critical operations, and club-level governance activities."
        category="Governance"
        actions={<ExportButton onExport={handleExport} disabled={loading || data.length === 0} />}
        filters={
          <ReportFilters
            initialFilters={filters}
            statusOptions={riskLevelOptions}
            statusLabel="Risk Level"
            searchPlaceholder="Search actor name, club, action, summary..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          />
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
          emptyMessage="No super admin audit records found for the selected criteria."
        />
      </ReportShell>
    </DashboardLayout>
  )
}
