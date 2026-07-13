"use client"

import { useCallback, useEffect, useState } from "react"
import { Coins, CheckCircle, XCircle, Clock } from "lucide-react"
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

interface RewardPointsRedemptionRow extends Record<string, unknown> {
  id: string
  timestamp: string
  memberName: string
  memberId: string
  pointsReserved: number
  pointsAccumulated: number
  pointsRemaining: number
  discountAmount: number
  usedAgainst: string
  status: string
  reason: string
  releasedAt: string | null
  expiresAt: string | null
  pointsExpireAt: string | null
  orderId: string | null
}

export default function RewardPointsRedemptionReportPage() {
  const auth = useReportAuthorization("reward-points-redemption")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RewardPointsRedemptionRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalPointsRedeemed: 0,
    totalRedemptions: 0,
    activeReservations: 0,
    releasedReservations: 0,
    expiredReservations: 0,
    totalDiscountValue: 0,
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


      const res = await apiClient.getRewardPointsRedemptionReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalPointsRedeemed: Number(res.data.summary.totalPointsRedeemed) || 0,
            totalRedemptions: Number(res.data.summary.totalRedemptions) || 0,
            activeReservations: Number(res.data.summary.activeReservations) || 0,
            releasedReservations: Number(res.data.summary.releasedReservations) || 0,
            expiredReservations: Number(res.data.summary.expiredReservations) || 0,
            totalDiscountValue: Number(res.data.summary.totalDiscountValue) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load Reward Points Redemption report")
        setData([])
      }
    } catch {
      toast.error("Error loading Reward Points Redemption report")
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
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status && filters.status !== "all") queryParams.status = filters.status

      const res = await apiClient.downloadRewardPointsRedemptionReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Reward Points Redemption as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<RewardPointsRedemptionRow>[] = [
    {
      key: "memberName",
      header: "Member",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.memberName}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{row.memberId.slice(0, 12)}...</div>
        </div>
      ),
      width: "w-40",
    },
    {
      key: "pointsAccumulated",
      header: "Points Accumulated",
      accessor: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {(row.pointsAccumulated ?? 0).toLocaleString()}
        </span>
      ),
      width: "w-32",
    },
    {
      key: "pointsReserved",
      header: "Points Redeemed",
      accessor: (row) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {(row.pointsReserved ?? 0).toLocaleString()}
        </span>
      ),
      sortable: true,
      width: "w-32",
    },
    {
      key: "pointsRemaining",
      header: "Points Remaining",
      accessor: (row) => <span className="font-mono text-xs">{(row.pointsRemaining ?? 0).toLocaleString()}</span>,
      width: "w-32",
    },
    {
      key: "discountAmount",
      header: "Discount",
      accessor: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.discountAmount)}
        </span>
      ),
      width: "w-28",
    },
    {
      key: "usedAgainst",
      header: "Used against",
      accessor: (row) => <Badge variant="outline">{row.usedAgainst}</Badge>,
      width: "w-28",
    },
    {
      key: "pointsExpireAt",
      header: "Expires",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.pointsExpireAt ? row.pointsExpireAt.replace("T", " ").slice(0, 10) : "—"}
        </span>
      ),
      width: "w-28",
    },
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
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Points Redeemed",
      value: summaryData.totalPointsRedeemed.toLocaleString(),
    },
    {
      label: "Total Discount Value",
      value: formatCurrency(summaryData.totalDiscountValue),
    },
    {
      label: "Active Reservations",
      value: summaryData.activeReservations.toLocaleString(),
    },
    {
      label: "Released",
      value: summaryData.releasedReservations.toLocaleString(),
    },
  ]

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "released", label: "Released" },
    { value: "expired", label: "Expired" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Reward Points Redemption Report"
        description="Redemption history tracking points reserved, discount amounts, status changes, and balance impact."
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
            statusOptions={statusOptions}
            statusLabel="Status"
            searchPlaceholder="Search member name, email, reason..."
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
          emptyMessage="No reward points redemption records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
