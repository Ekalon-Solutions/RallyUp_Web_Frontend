"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoppingBag, TrendingUp, XCircle } from "lucide-react"
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

// â”€â”€â”€ Status Badge Renderers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderPaymentStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Paid</Badge>
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Pending</Badge>
    case "failed":
    case "refunded":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function renderOrderStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "completed":
    case "shipped":
    case "delivered":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">{status}</Badge>
    case "ready_to_ship":
    case "fulfillment_in_progress":
    case "pending":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
    case "cancelled":
    case "refunded":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

// â”€â”€â”€ Row Interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TotalOrderSummaryRow extends Record<string, unknown> {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderDate: string
  totalAmount: number
  currency: string
  paymentStatus: string
  orderStatus: string
  itemsCount: number;
  paymentMethod: string
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function TotalOrderSummaryReportPage() {
  const auth = useReportAuthorization("order-summary")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TotalOrderSummaryRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalOrders: 0,
    grossRevenue: 0,
    averageOrderValue: 0,
    cancelledOrders: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: {
      paymentStatus: "all",
    },
  })

  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "createdAt",
    direction: "desc",
  })

  const [page, setPage] = useState(1)

  // â”€â”€ Fetch Report Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

      if (filters.extras?.paymentStatus && filters.extras.paymentStatus !== "all") {
        queryParams.paymentStatus = filters.extras.paymentStatus
      }

      const res = await apiClient.getTotalOrderSummaryReport(queryParams)
      if (res.success && res.data) {
        setData(res.data.data)
        if (res.data.meta?.pagination) {
          setPagination(res.data.meta.pagination)
        }
        if (res.data.summary) {
          setSummaryData({
            totalOrders: Number(res.data.summary.totalOrders) || 0,
            grossRevenue: Number(res.data.summary.grossRevenue) || 0,
            averageOrderValue: Number(res.data.summary.averageOrderValue) || 0,
            cancelledOrders: Number(res.data.summary.cancelledOrders) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load order summary")
        setData([])
      }
    } catch {
      toast.error("Error loading total order summary report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clubId, selectedClubId, isSystemOwner, page, sort, filters, auth.authorized])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleApplyFilters = (newFilters: ReportFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({ extras: { paymentStatus: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = {
        clubId,
        format,
      }
      if (filters.extras?.paymentStatus && filters.extras.paymentStatus !== "all") {
        queryParams.paymentStatus = filters.extras.paymentStatus
      }

      const res = await apiClient.downloadTotalOrderSummaryReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Total Order Summary as ${format.toUpperCase()}`)
      }
    } catch {
      toast.error("Export failed")
    }
  }

  // â”€â”€ Access & Feature Guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (!auth.authorized) {
    return (
      <DashboardLayout>
        <AccessDeniedPage reason={auth.reason} message={auth.message} />
      </DashboardLayout>
    )
  }

  // â”€â”€ Column Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const columns: ReportColumn<TotalOrderSummaryRow>[] = [
    {
      key: "orderNumber",
      header: "Order ID",
      accessor: (row) => <span className="font-mono font-medium">{row.orderNumber}</span>,
      width: "w-36",
    },
    {
      key: "customerName",
      header: "Customer",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.customerName}</div>
          <div className="text-[11px] text-muted-foreground">{row.customerEmail}</div>
        </div>
      ),
      width: "w-48",
    },
    {
      key: "createdAt",
      header: "Order Date",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.orderDate ? row.orderDate.replace("T", " ").slice(0, 16) : "â€”"}
        </span>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "total",
      header: "Total Amount",
      accessor: (row) => (
        <span className="font-mono font-semibold">
          {formatCurrency(row.totalAmount, row.currency)}
        </span>
      ),
      sortable: true,
      align: "right",
      width: "w-36",
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      accessor: (row) =>
        row.totalAmount === 0
          ? <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300 border-0 font-medium">Free</Badge>
          : renderPaymentStatusBadge(row.paymentStatus),
      sortable: true,
      width: "w-32",
    },
    {
      key: "status",
      header: "Order Status",
      accessor: (row) => renderOrderStatusBadge(row.orderStatus),
      sortable: true,
      width: "w-36",
    },
    {
      key: "itemsCount",
      header: "Items",
      accessor: "itemsCount",
      align: "center",
      width: "w-20",
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      accessor: (row) => <span className="text-xs uppercase font-medium">{row.paymentMethod}</span>,
      width: "w-32",
    },
  ]

  // â”€â”€ Summary Cards Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Orders",
      value: summaryData.totalOrders.toLocaleString(),
    },
    {
      label: "Gross Revenue",
      value: formatCurrency(summaryData.grossRevenue),
    },
    {
      label: "Average Order Value",
      value: formatCurrency(summaryData.averageOrderValue),
    },
    {
      label: "Cancelled Orders",
      value: summaryData.cancelledOrders.toLocaleString(),
    },
  ]

  const orderStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "ready_to_ship", label: "Ready to Ship" },
    { value: "fulfillment_in_progress", label: "In Progress" },
    { value: "shipped", label: "Shipped" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ]

  const paymentStatusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Total Order Summary"
        description="Comprehensive financial overview of merchandise and store orders, payment statuses, and fulfillment states."
        category="Revenue"
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
            statusOptions={orderStatusOptions}
            statusLabel="Order Status"
            searchPlaceholder="Search by Order ID, customer name, email, phone..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {/* Custom Extra Filter: Payment Status Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment Status</Label>
              <Select
                value={filters.extras?.paymentStatus || "all"}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    extras: { ...prev.extras, paymentStatus: val },
                  }))
                }
              >
                <SelectTrigger className="w-38">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {paymentStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          emptyMessage="No store orders found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
