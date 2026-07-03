"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldAlert, ArrowUpRight, ArrowDownRight, Key } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { buildReportQueryParams, shouldFetchReport } from "@/lib/reportHelpers"
import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { apiClient } from "@/lib/api"
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

function renderActionBadge(action: string) {
  const a = (action || "").toUpperCase()
  if (a.includes("PROMOTE")) {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Promoted</Badge>
  }
  if (a.includes("DEMOTE") || a.includes("DOWNGRADED")) {
    return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Demoted</Badge>
  }
  if (a.includes("PERMISSION")) {
    return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-0 font-medium">Permission Change</Badge>
  }
  if (a.includes("ACTIVATED")) {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">Activated</Badge>
  }
  if (a.includes("DEACTIVATED")) {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Deactivated</Badge>
  }
  return <Badge variant="outline">{action}</Badge>
}

interface ElevateDemoteRow extends Record<string, unknown> {
  id: string
  timestamp: string
  actorName: string
  actorType: string
  action: string
  targetType: string
  targetId: string
  oldState: string
  newState: string
  summary: string
}

export default function ElevateDemoteReportPage() {
  const auth = useReportAuthorization("elevate-demote")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ElevateDemoteRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalChanges: 0,
    promotions: 0,
    demotions: 0,
    permissionChanges: 0,
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

      if (filters.status && filters.status !== "all") queryParams.action = filters.status

      const res = await apiClient.getElevateDemoteLogReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalChanges: Number(res.data.summary.totalChanges) || 0,
            promotions: Number(res.data.summary.promotions) || 0,
            demotions: Number(res.data.summary.demotions) || 0,
            permissionChanges: Number(res.data.summary.permissionChanges) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load Elevate/Demote report")
        setData([])
      }
    } catch {
      toast.error("Error loading Elevate/Demote report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clubId, selectedClubId, isSystemOwner, page, sort, filters, auth.authorized])

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
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.status && filters.status !== "all") queryParams.action = filters.status

      const res = await apiClient.downloadElevateDemoteLogReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Elevate/Demote Log as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<ElevateDemoteRow>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.timestamp ? row.timestamp.replace("T", " ").slice(0, 19) : "â€”"}
        </span>
      ),
      sortable: true,
      width: "w-44",
    },
    {
      key: "targetId",
      header: "Target ID / User",
      accessor: (row) => (
        <div>
          <div className="font-mono text-xs font-medium">{row.targetId}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{row.targetType}</div>
        </div>
      ),
      width: "w-40",
    },
    {
      key: "action",
      header: "Action",
      accessor: (row) => renderActionBadge(row.action),
      sortable: true,
      width: "w-40",
    },
    {
      key: "oldState",
      header: "Role Shift",
      accessor: (row) => (
        <div className="flex items-center gap-1 text-xs">
          <span className="font-mono text-muted-foreground">{row.oldState || "None"}</span>
          <span>â†’</span>
          <span className="font-mono font-medium">{row.newState || "Updated"}</span>
        </div>
      ),
      width: "w-48",
    },
    {
      key: "actorName",
      header: "Changed By",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.actorName}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{row.actorType}</div>
        </div>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "summary",
      header: "Summary",
      accessor: (row) => <span className="text-xs text-muted-foreground truncate max-w-[240px] block" title={row.summary}>{row.summary}</span>,
      width: "w-56",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Role Changes",
      value: summaryData.totalChanges.toLocaleString(),
      icon: ShieldAlert,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Promotions",
      value: summaryData.promotions.toLocaleString(),
      icon: ArrowUpRight,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Demotions",
      value: summaryData.demotions.toLocaleString(),
      icon: ArrowDownRight,
      iconColor: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    },
    {
      label: "Permission Changes",
      value: summaryData.permissionChanges.toLocaleString(),
      icon: Key,
      iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
  ]

  const actionOptions = [
    { value: "PROMOTE_TO_ADMIN", label: "Promote to Admin" },
    { value: "DEMOTE_ADMIN", label: "Demote Admin" },
    { value: "PERMISSION_CHANGE", label: "Permission Change" },
    { value: "ADMIN_ACTIVATED", label: "Admin Activated" },
    { value: "ADMIN_DEACTIVATED", label: "Admin Deactivated" },
    { value: "ADMIN_DOWNGRADED_TO_VENDOR", label: "Downgraded to Vendor" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Elevate / Demote Log Report"
        description="Audit log tracking administrative promotions, role demotions, privilege escalations, and permission changes."
        category="Governance"
        actions={<ExportButton onExport={handleExport} disabled={loading || data.length === 0} />}
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
            statusOptions={actionOptions}
            statusLabel="Action Type"
            searchPlaceholder="Search actor name, summary, target ID..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          />
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
          emptyMessage="No elevate / demote audit records found for the selected criteria."
        />
      </ReportShell>
    </DashboardLayout>
  )
}
