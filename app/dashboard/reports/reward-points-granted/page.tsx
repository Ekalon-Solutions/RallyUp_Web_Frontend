"use client"

import { useCallback, useEffect, useState } from "react"
import { Gift, Users, Calendar, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { buildReportQueryParams, shouldFetchReport, resolveExportClubId } from "@/lib/reportHelpers"
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

function renderSourceTypeBadge(sourceType: string) {
  const type = (sourceType || "").toLowerCase()
  if (type === "attendance") {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Attendance</Badge>
  }
  if (type === "adjustment") {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">Adjustment</Badge>
  }
  return <Badge variant="outline">Other</Badge>
}

interface RewardPointsGrantedRow extends Record<string, unknown> {
  id: string
  timestamp: string
  memberName: string
  memberId: string
  points: number
  sourceType: string
  sourceId: string | null
  sourceDescription: string
  expiresAt: string | null
  expired: boolean
  notes: string
}

export default function RewardPointsGrantedReportPage() {
  const auth = useReportAuthorization("reward-points-granted")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RewardPointsGrantedRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalPointsGranted: 0,
    totalTransactions: 0,
    pointsByAttendance: 0,
    pointsByAdjustment: 0,
    pointsByOther: 0,
    uniqueMembers: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
  })

  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "earnedAt",
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

      if (filters.status && filters.status !== "all") queryParams.sourceType = filters.status

      const res = await apiClient.getRewardPointsGrantedReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalPointsGranted: Number(res.data.summary.totalPointsGranted) || 0,
            totalTransactions: Number(res.data.summary.totalTransactions) || 0,
            pointsByAttendance: Number(res.data.summary.pointsByAttendance) || 0,
            pointsByAdjustment: Number(res.data.summary.pointsByAdjustment) || 0,
            pointsByOther: Number(res.data.summary.pointsByOther) || 0,
            uniqueMembers: Number(res.data.summary.uniqueMembers) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load Reward Points Granted report")
        setData([])
      }
    } catch {
      toast.error("Error loading Reward Points Granted report")
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
      const queryParams: Record<string, any> = { format, ...resolveExportClubId({ clubId, selectedClubId, isSystemOwner }) }
      if (filters.status && filters.status !== "all") queryParams.sourceType = filters.status

      const res = await apiClient.downloadRewardPointsGrantedReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Reward Points Granted as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<RewardPointsGrantedRow>[] = [
    {
      key: "earnedAt",
      header: "Timestamp",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.timestamp ? row.timestamp.replace("T", " ").slice(0, 19) : "Ã¢â‚¬â€"}
        </span>
      ),
      sortable: true,
      width: "w-44",
    },
    {
      key: "memberName",
      header: "Member",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.memberName}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{row.memberId.slice(0, 12)}...</div>
        </div>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "points",
      header: "Points",
      accessor: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          +{row.points.toLocaleString()}
        </span>
      ),
      sortable: true,
      width: "w-24",
    },
    {
      key: "sourceType",
      header: "Source",
      accessor: (row) => renderSourceTypeBadge(row.sourceType),
      sortable: true,
      width: "w-28",
    },
    {
      key: "expiresAt",
      header: "Expires",
      accessor: (row) => {
        if (!row.expiresAt) return <span className="text-xs text-muted-foreground">Never</span>
        if (row.expired) return <Badge variant="destructive" className="text-xs">Expired</Badge>
        return (
          <span className="font-mono text-xs">
            {row.expiresAt.replace("T", " ").slice(0, 10)}
          </span>
        )
      },
      width: "w-32",
    },
    {
      key: "notes",
      header: "Notes",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-full block" title={row.notes}>
          {row.notes || "Ã¢â‚¬â€"}
        </span>
      ),
      width: "w-48",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Points Granted",
      value: summaryData.totalPointsGranted.toLocaleString(),
    },
    {
      label: "Total Transactions",
      value: summaryData.totalTransactions.toLocaleString(),
    },
    {
      label: "Unique Members",
      value: summaryData.uniqueMembers.toLocaleString(),
    },
    {
      label: "Attendance Points",
      value: summaryData.pointsByAttendance.toLocaleString(),
    },
  ]

  const sourceTypeOptions = [
    { value: "attendance", label: "Attendance" },
    { value: "adjustment", label: "Manual Adjustment" },
    { value: "other", label: "Other" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Reward Points Granted Report"
        description="Member-wise breakdown of loyalty points awarded through attendance, manual adjustments, and other sources."
        category="Platform"
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
            statusOptions={sourceTypeOptions}
            statusLabel="Source Type"
            searchPlaceholder="Search member name, email, notes..."
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
          emptyMessage="No reward points granted records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
