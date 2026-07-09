"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { buildReportQueryParams, shouldFetchReport, resolveExportClubId } from "@/lib/reportHelpers"
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

function renderDeliveryStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "delivered":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Delivered</Badge>
    case "out_for_delivery":
    case "in_transit":
    case "shipped":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
    case "rto_initiated":
    case "rto_delivered":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
    case "damaged":
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-0 font-medium">Damaged</Badge>
    case "lost":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-0 font-medium">Lost</Badge>
    case "ready_to_ship":
    case "fulfillment_in_progress":
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
    case "completed":
      return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-0 font-medium">Completed</Badge>
    case "cancelled":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Cancelled</Badge>
    case "refunded":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Refunded</Badge>
    case "pending":
      return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300 border-0 font-medium">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

interface PickupDeliveryRow extends Record<string, unknown> {
  id: string
  orderNumber: string
  memberName: string
  memberEmail: string
  city: string
  courierName: string
  deliveryStatus: string
  awbCode: string
  shippedDate: string | null
  deliveredDate: string | null
  shippingCost: number
}

export default function PickupDeliveryReportPage() {
  const auth = useReportAuthorization("pickup-delivery")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PickupDeliveryRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalOrders: 0,
    outForDeliveryCount: 0,
    deliveredCount: 0,
    rtoCount: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { courierName: "all" },
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
      if (filters.extras?.courierName && filters.extras.courierName !== "all") {
        queryParams.courierName = filters.extras.courierName
      }

      const res = await apiClient.getPickupDeliveryReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalOrders: Number(res.data.summary.totalOrders) || 0,
            outForDeliveryCount: Number(res.data.summary.outForDeliveryCount) || 0,
            deliveredCount: Number(res.data.summary.deliveredCount) || 0,
            rtoCount: Number(res.data.summary.rtoCount) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load logistics report")
        setData([])
      }
    } catch {
      toast.error("Error loading pickup & delivery report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clubId, selectedClubId, isSystemOwner, page, sort, filters, auth.authorized])

  const [courierOptions, setCourierOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  useEffect(() => {
    if (data.length > 0) {
      const unique = [...new Set(data.map((r) => r.courierName).filter(Boolean))]
      unique.sort()
      setCourierOptions(unique.map((c) => ({ value: c, label: c })))
    }
  }, [data])

  const handleApplyFilters = (newFilters: ReportFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({ extras: { courierName: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { format, ...resolveExportClubId({ clubId, selectedClubId, isSystemOwner }) }
      if (filters.status && filters.status !== "all") queryParams.deliveryStatus = filters.status
      if (filters.extras?.courierName && filters.extras.courierName !== "all") {
        queryParams.courierName = filters.extras.courierName
      }

      const res = await apiClient.downloadPickupDeliveryReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Pickup & Delivery as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<PickupDeliveryRow>[] = [
    {
      key: "orderNumber",
      header: "Order Number",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.orderNumber}</span>,
      width: "w-36",
    },
    {
      key: "memberName",
      header: "Member Name",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.memberName}</div>
          <div className="text-[11px] text-muted-foreground">{row.memberEmail}</div>
        </div>
      ),
      width: "w-48",
    },
    {
      key: "city",
      header: "City",
      accessor: "city",
      width: "w-32",
    },
    {
      key: "courierName",
      header: "Courier",
      accessor: "courierName",
      sortable: true,
      width: "w-36",
    },
    {
      key: "deliveryStatus",
      header: "Delivery Status",
      accessor: (row) => renderDeliveryStatusBadge(row.deliveryStatus),
      sortable: true,
      width: "w-36",
    },
    {
      key: "awbCode",
      header: "AWB Code",
      accessor: (row) => <span className="font-mono text-xs">{row.awbCode}</span>,
      width: "w-36",
    },
    {
      key: "shippedDate",
      header: "Shipped Date",
      accessor: (row) => (row.shippedDate ? row.shippedDate.slice(0, 10) : "N/A"),
      width: "w-32",
    },
    {
      key: "deliveredDate",
      header: "Delivered Date",
      accessor: (row) => (row.deliveredDate ? row.deliveredDate.slice(0, 10) : "N/A"),
      width: "w-32",
    },
    {
      key: "shippingCost",
      header: "Shipping Cost",
      accessor: (row) => <span className="font-mono">{formatCurrency(row.shippingCost)}</span>,
      sortable: true,
      align: "right",
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Orders",
      value: summaryData.totalOrders.toLocaleString(),
    },
    {
      label: "Out for Delivery",
      value: summaryData.outForDeliveryCount.toLocaleString(),
    },
    {
      label: "Delivered Orders",
      value: summaryData.deliveredCount.toLocaleString(),
    },
    {
      label: "RTO Orders",
      value: summaryData.rtoCount.toLocaleString(),
    },
  ]

  const deliveryStatusOptions = [
    { value: "shipped", label: "Shipped" },
    { value: "in_transit", label: "In Transit" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "rto_initiated", label: "RTO Initiated" },
    { value: "rto_delivered", label: "RTO Delivered" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Pickup & Delivery Report"
        description="Tracks shipment fulfillment status, courier performance, AWB tracking codes, delivery timelines, and logistics costs."
        category="Logistics"
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
            searchPlaceholder="Search order number, AWB, courier, city, member..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {courierOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Courier</Label>
                <Select
                  value={filters.extras?.courierName || "all"}
                  onValueChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      extras: { ...prev.extras, courierName: val },
                    }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Couriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Couriers</SelectItem>
                    {courierOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
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
          emptyMessage="No logistics shipment records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
