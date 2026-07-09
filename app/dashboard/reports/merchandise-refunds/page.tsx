"use client"

import { useCallback, useEffect, useState } from "react"
import { RotateCcw, PackageX, Clock } from "lucide-react"
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
  type ExportFormat,
} from "@/components/reports"

function renderRefundStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "processed") return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Processed</Badge>
  if (s === "requested" || s === "pending") return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Pending</Badge>
  if (s === "rejected") return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Rejected</Badge>
  return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
}

interface MerchandiseRefundsRow extends Record<string, unknown> {
  id: string
  refundId: string
  orderReference: string
  product: string
  customerName: string
  customerEmail: string
  returnedQuantity: number
  refundAmount: number
  currency: string
  returnReason: string
  refundStatus: string
  requestedDate: string
  processedDate: string | null
}

export default function MerchandiseRefundsReportPage() {
  const auth = useReportAuthorization("merchandise-refunds")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MerchandiseRefundsRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({ totalRefunds: 0, refundAmount: 0, returnedQuantity: 0, pendingRefunds: 0 })
  const [filters, setFilters] = useState<ReportFiltersState>({})
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({ field: "requestedAt", direction: "desc" })
  const [page, setPage] = useState(1)

  const fetchReport = useCallback(async () => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    setLoading(true)
    try {
      const queryParams: Record<string, any> = { clubId, page, limit: 20, sortBy: sort.field, sortDir: sort.direction }

      const res = await apiClient.getMerchandiseRefundsReport(queryParams)
      if (res.success && res.data) {
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)
        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalRefunds: Number(res.data.summary.totalRefunds) || 0,
            refundAmount: Number(res.data.summary.refundAmount) || 0,
            returnedQuantity: Number(res.data.summary.returnedQuantity) || 0,
            pendingRefunds: Number(res.data.summary.pendingRefunds) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load merchandise refunds report")
        setData([])
      }
    } catch {
      toast.error("Error loading merchandise refunds report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clubId, selectedClubId, isSystemOwner, page, sort, filters, auth.authorized])

  useEffect(() => { fetchReport() }, [fetchReport])

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
      const res = await apiClient.downloadMerchandiseRefundsReport(queryParams)
      if (!res.success) toast.error(res.error || "Export failed")
      else toast.success(`Exported Merchandise Refunds as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<MerchandiseRefundsRow>[] = [
    { key: "refundId", header: "Refund ID", accessor: (row) => <span className="font-mono text-xs font-medium">{row.refundId}</span>, width: "w-36" },
    { key: "orderReference", header: "Order Reference", accessor: (row) => <span className="font-mono text-xs">{row.orderReference}</span>, width: "w-36" },
    { key: "product", header: "Product", accessor: "product", width: "w-52" },
    { key: "customerName", header: "Customer", accessor: (row) => <div><div className="font-medium text-xs">{row.customerName}</div><div className="text-[11px] text-muted-foreground">{row.customerEmail}</div></div>, width: "w-48" },
    { key: "returnedQuantity", header: "Returned Qty", accessor: "returnedQuantity", sortable: true, align: "center", width: "w-28" },
    { key: "estimatedRefund", header: "Refund Amount", accessor: (row) => <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(row.refundAmount, row.currency)}</span>, sortable: true, align: "right", width: "w-36" },
    { key: "returnReason", header: "Return Reason", accessor: "returnReason", width: "w-48" },
    { key: "status", header: "Refund Status", accessor: (row) => renderRefundStatusBadge(row.refundStatus), sortable: true, width: "w-32" },
    { key: "requestedAt", header: "Requested Date", accessor: (row) => <span className="font-mono text-xs">{row.requestedDate ? row.requestedDate.replace("T", " ").slice(0, 16) : "N/A"}</span>, sortable: true, width: "w-40" },
  ]

  const summaryCards: SummaryCard[] = [
    { label: "Total Refunds", value: summaryData.totalRefunds.toLocaleString() },
    { label: "Refund Amount", value: formatCurrency(summaryData.refundAmount) },
    { label: "Returned Quantity", value: summaryData.returnedQuantity.toLocaleString() },
    { label: "Pending Refunds", value: summaryData.pendingRefunds.toLocaleString() },
  ]

  const refundStatusOptions = [
    { value: "requested", label: "Requested" },
    { value: "processed", label: "Processed" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Merchandise Refunds / Returns Report"
        description="Store order returns with refund status, returned quantities, customer details, products, and order references."
        category="Revenue"
        actions={<ExportButton onExport={handleExport} disabled={loading || data.length === 0} />}
        filters={<ReportFilters initialFilters={filters} statusOptions={refundStatusOptions} statusLabel="Refund Status" searchPlaceholder="Search refund ID, order, product, customer, reason..." onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} loading={loading} />}
        summary={<ReportSummaryCards cards={summaryCards} loading={loading} />}
      >
        <ReportTable columns={columns} data={data} loading={loading} pagination={pagination} sort={sort} onSortChange={setSort} onPageChange={setPage} emptyMessage="No merchandise refund records found for the selected criteria." showClubColumn={isSystemOwner && !selectedClubId} />
      </ReportShell>
    </DashboardLayout>
  )
}
