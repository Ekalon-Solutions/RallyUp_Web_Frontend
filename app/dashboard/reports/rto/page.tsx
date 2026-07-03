"use client"

import { useCallback, useEffect, useState } from "react"
import { PackageX, TrendingUp, DollarSign, Truck } from "lucide-react"
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

function renderDeliveryStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "rto_initiated") {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">RTO Initiated</Badge>
  }
  if (s === "rto_delivered") {
    return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">RTO Delivered</Badge>
  }
  if (s === "in_transit") {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">In Transit</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

interface RTORow extends Record<string, unknown> {
  id: string
  orderNumber: string
  customerName: string
  orderDate: string
  shippedAt: string | null
  deliveryStatus: string
  courierName: string
  awbCode: string
  rtoInitiatedAt: string | null
  rtoDeliveredAt: string | null
  rtoCharge: number
  orderTotal: number
  shippingAddress: string
}

export default function RTOReportPage() {
  const auth = useReportAuthorization("rto")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RTORow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalRTOs: 0,
    rtoInitiated: 0,
    rtoDelivered: 0,
    totalRTOCharges: 0,
    averageRTOCharge: 0,
    totalOrderValue: 0,
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

      if (filters.status && filters.status !== "all") queryParams.deliveryStatus = filters.status

      const res = await apiClient.getRTOReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalRTOs: Number(res.data.summary.totalRTOs) || 0,
            rtoInitiated: Number(res.data.summary.rtoInitiated) || 0,
            rtoDelivered: Number(res.data.summary.rtoDelivered) || 0,
            totalRTOCharges: Number(res.data.summary.totalRTOCharges) || 0,
            averageRTOCharge: Number(res.data.summary.averageRTOCharge) || 0,
            totalOrderValue: Number(res.data.summary.totalOrderValue) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load RTO report")
        setData([])
      }
    } catch {
      toast.error("Error loading RTO report")
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
      if (filters.status && filters.status !== "all") queryParams.deliveryStatus = filters.status

      const res = await apiClient.downloadRTOReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported RTO Report as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<RTORow>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      accessor: (row) => (
        <div>
          <div className="font-mono text-xs font-medium">{row.orderNumber}</div>
          <div className="text-[10px] text-muted-foreground">
            {row.orderDate ? row.orderDate.slice(0, 10) : "â€”"}
          </div>
        </div>
      ),
      sortable: true,
      width: "w-36",
    },
    {
      key: "customerName",
      header: "Customer",
      accessor: (row) => (
        <div className="font-medium text-xs">{row.customerName}</div>
      ),
      width: "w-40",
    },
    {
      key: "deliveryStatus",
      header: "Status",
      accessor: (row) => renderDeliveryStatusBadge(row.deliveryStatus),
      sortable: true,
      width: "w-36",
    },
    {
      key: "courierName",
      header: "Courier",
      accessor: (row) => (
        <div>
          <div className="text-xs font-medium">{row.courierName || "â€”"}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{row.awbCode || "â€”"}</div>
        </div>
      ),
      width: "w-36",
    },
    {
      key: "rtoCharge",
      header: "RTO Charge",
      accessor: (row) => (
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          {row.rtoCharge > 0 ? `â‚¹${row.rtoCharge.toLocaleString()}` : "â€”"}
        </span>
      ),
      sortable: true,
      width: "w-28",
    },
    {
      key: "orderTotal",
      header: "Order Value",
      accessor: (row) => (
        <span className="font-mono text-xs">â‚¹{row.orderTotal.toLocaleString()}</span>
      ),
      width: "w-28",
    },
    {
      key: "rtoInitiatedAt",
      header: "RTO Timeline",
      accessor: (row) => (
        <div className="text-[10px]">
          {row.rtoInitiatedAt && (
            <div>
              <span className="text-muted-foreground">Initiated: </span>
              <span className="font-mono">{row.rtoInitiatedAt.slice(0, 10)}</span>
            </div>
          )}
          {row.rtoDeliveredAt && (
            <div className="mt-0.5">
              <span className="text-muted-foreground">Delivered: </span>
              <span className="font-mono">{row.rtoDeliveredAt.slice(0, 10)}</span>
            </div>
          )}
          {!row.rtoInitiatedAt && !row.rtoDeliveredAt && <span className="text-muted-foreground">â€”</span>}
        </div>
      ),
      width: "w-40",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total RTOs",
      value: summaryData.totalRTOs.toLocaleString(),
      icon: PackageX,
      iconColor: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    },
    {
      label: "Total RTO Charges",
      value: `â‚¹${summaryData.totalRTOCharges.toLocaleString()}`,
      icon: DollarSign,
      iconColor: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      label: "Average RTO Charge",
      value: `â‚¹${Math.round(summaryData.averageRTOCharge).toLocaleString()}`,
      icon: TrendingUp,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "RTO Initiated",
      value: summaryData.rtoInitiated.toLocaleString(),
      icon: Truck,
      iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
  ]

  const deliveryStatusOptions = [
    { value: "rto_initiated", label: "RTO Initiated" },
    { value: "rto_delivered", label: "RTO Delivered" },
    { value: "in_transit", label: "In Transit" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="RTO (Return to Origin) Report"
        description="Failed delivery tracking with courier performance, RTO charges, timeline analysis, and shipping address details."
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
            statusOptions={deliveryStatusOptions}
            statusLabel="Delivery Status"
            searchPlaceholder="Search order number, customer, AWB..."
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
          emptyMessage="No RTO (Return to Origin) records found for the selected criteria."
        />
      </ReportShell>
    </DashboardLayout>
  )
}
