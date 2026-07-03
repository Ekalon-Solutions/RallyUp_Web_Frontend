"use client"

import { useCallback, useEffect, useState } from "react"
import { Package, DollarSign, Tag, TrendingUp } from "lucide-react"
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

function renderFulfillmentStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "delivered":
    case "completed":
    case "shipped":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">{status}</Badge>
    case "out_for_delivery":
    case "in_transit":
    case "ready_to_ship":
    case "pending":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
    case "cancelled":
    case "refunded":
    case "rto_initiated":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
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

interface MerchandiseSalesRow extends Record<string, unknown> {
  id: string
  orderNumber: string
  productName: string
  sku: string
  variant: string
  quantity: number
  price: number
  discount: number
  shipping: number
  totalAmount: number
  currency: string
  fulfillmentStatus: string
  paymentStatus: string
  orderDate: string
}

export default function MerchandiseSalesReportPage() {
  const auth = useReportAuthorization("merchandise-sales")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MerchandiseSalesRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalUnits: 0,
    grossSales: 0,
    totalDiscounts: 0,
    netSales: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { paymentStatus: "all" },
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

      if (filters.extras?.paymentStatus && filters.extras.paymentStatus !== "all") {
        queryParams.paymentStatus = filters.extras.paymentStatus
      }

      const res = await apiClient.getMerchandiseSalesReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalUnits: Number(res.data.summary.totalUnits) || 0,
            grossSales: Number(res.data.summary.grossSales) || 0,
            totalDiscounts: Number(res.data.summary.totalDiscounts) || 0,
            netSales: Number(res.data.summary.netSales) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load merchandise sales report")
        setData([])
      }
    } catch {
      toast.error("Error loading merchandise sales report")
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
    setFilters({ extras: { paymentStatus: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.paymentStatus && filters.extras.paymentStatus !== "all") {
        queryParams.paymentStatus = filters.extras.paymentStatus
      }

      const res = await apiClient.downloadMerchandiseSalesReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Merchandise Sales as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<MerchandiseSalesRow>[] = [
    {
      key: "orderNumber",
      header: "Order ID",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.orderNumber}</span>,
      width: "w-36",
    },
    {
      key: "productName",
      header: "Product / SKU",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.productName}</div>
          <div className="text-[11px] text-muted-foreground font-mono">SKU: {row.sku}</div>
        </div>
      ),
      width: "w-48",
    },
    {
      key: "variant",
      header: "Variant",
      accessor: (row) => <span className="text-xs text-muted-foreground">{row.variant}</span>,
      width: "w-28",
    },
    {
      key: "quantity",
      header: "Qty",
      accessor: "quantity",
      sortable: true,
      align: "center",
      width: "w-20",
    },
    {
      key: "price",
      header: "Unit Price",
      accessor: (row) => <span className="font-mono text-xs">{formatCurrency(row.price, row.currency)}</span>,
      align: "right",
      width: "w-28",
    },
    {
      key: "discount",
      header: "Discount",
      accessor: (row) => <span className="font-mono text-xs text-rose-600 dark:text-rose-400">{formatCurrency(row.discount, row.currency)}</span>,
      align: "right",
      width: "w-28",
    },
    {
      key: "totalAmount",
      header: "Item Total",
      accessor: (row) => <span className="font-mono font-semibold">{formatCurrency(row.totalAmount, row.currency)}</span>,
      sortable: true,
      align: "right",
      width: "w-32",
    },
    {
      key: "fulfillmentStatus",
      header: "Fulfillment Status",
      accessor: (row) => renderFulfillmentStatusBadge(row.fulfillmentStatus),
      width: "w-36",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Units Sold",
      value: summaryData.totalUnits.toLocaleString(),
      icon: Package,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Gross Sales",
      value: formatCurrency(summaryData.grossSales),
      icon: DollarSign,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Total Discounts",
      value: formatCurrency(summaryData.totalDiscounts),
      icon: Tag,
      iconColor: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    },
    {
      label: "Net Merchandise Sales",
      value: formatCurrency(summaryData.netSales),
      icon: TrendingUp,
      iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
  ]

  const orderStatusOptions = [
    { value: "completed", label: "Completed" },
    { value: "shipped", label: "Shipped" },
    { value: "in_transit", label: "In Transit" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const paymentStatusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Merchandise Sales / Order Report"
        description="Line-item breakdown of merchandise orders, product SKUs, variant quantities, gross sales, and fulfillment statuses."
        category="Revenue"
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
            statusOptions={orderStatusOptions}
            statusLabel="Fulfillment Status"
            searchPlaceholder="Search order number, product name, SKU, customer..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment Status</Label>
              <Select
                value={filters.extras?.paymentStatus || "all"}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, paymentStatus: val } }))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {paymentStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
          emptyMessage="No merchandise sales records found for the selected criteria."
        />
      </ReportShell>
    </DashboardLayout>
  )
}
