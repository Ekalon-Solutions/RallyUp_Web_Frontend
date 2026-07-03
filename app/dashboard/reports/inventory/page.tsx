"use client"

import { useCallback, useEffect, useState } from "react"
import { Package, Archive, CheckCircle, AlertTriangle } from "lucide-react"
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

function renderStockBadge(row: InventoryRow) {
  if (row.outOfStockIndicator) return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Out of Stock</Badge>
  if (row.lowStockIndicator) return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Low Stock</Badge>
  return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Available</Badge>
}

interface InventoryRow extends Record<string, unknown> {
  id: string
  product: string
  sku: string
  variant: string
  category: string
  currentStock: number
  reservedStock: number
  availableStock: number
  lowStockIndicator: boolean
  outOfStockIndicator: boolean
  status: string
}

export default function InventoryReportPage() {
  const auth = useReportAuthorization("inventory")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<InventoryRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({ currentStock: 0, reservedStock: 0, availableStock: 0, lowStockProducts: 0, outOfStockProducts: 0 })
  const [filters, setFilters] = useState<ReportFiltersState>({ extras: { stockStatus: "all" } })
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({ field: "name", direction: "asc" })
  const [page, setPage] = useState(1)

  const fetchReport = useCallback(async () => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    setLoading(true)
    try {
      const queryParams: Record<string, any> = { clubId, page, limit: 20, sortBy: sort.field, sortDir: sort.direction }
      if (filters.extras?.stockStatus && filters.extras.stockStatus !== "all") queryParams.stockStatus = filters.extras.stockStatus

      const res = await apiClient.getInventoryReport(queryParams)
      if (res.success && res.data) {
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)
        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            currentStock: Number(res.data.summary.currentStock) || 0,
            reservedStock: Number(res.data.summary.reservedStock) || 0,
            availableStock: Number(res.data.summary.availableStock) || 0,
            lowStockProducts: Number(res.data.summary.lowStockProducts) || 0,
            outOfStockProducts: Number(res.data.summary.outOfStockProducts) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load inventory report")
        setData([])
      }
    } catch {
      toast.error("Error loading inventory report")
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
    setFilters({ extras: { stockStatus: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.stockStatus && filters.extras.stockStatus !== "all") queryParams.stockStatus = filters.extras.stockStatus
      const res = await apiClient.downloadInventoryReport(queryParams)
      if (!res.success) toast.error(res.error || "Export failed")
      else toast.success(`Exported Inventory as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<InventoryRow>[] = [
    { key: "product", header: "Product", accessor: (row) => <div><div className="font-medium text-xs">{row.product}</div><div className="text-[11px] text-muted-foreground font-mono">SKU: {row.sku}</div></div>, sortable: true, width: "w-56" },
    { key: "variant", header: "Variant", accessor: "variant", width: "w-28" },
    { key: "category", header: "Category", accessor: "category", width: "w-28" },
    { key: "stockQuantity", header: "Current Stock", accessor: "currentStock", sortable: true, align: "center", width: "w-32" },
    { key: "reservedStock", header: "Reserved Stock", accessor: "reservedStock", sortable: true, align: "center", width: "w-32" },
    { key: "availableStock", header: "Available Stock", accessor: "availableStock", sortable: true, align: "center", width: "w-32" },
    { key: "status", header: "Indicator", accessor: (row) => renderStockBadge(row), width: "w-32" },
  ]

  const summaryCards: SummaryCard[] = [
    { label: "Current Stock", value: summaryData.currentStock.toLocaleString(), icon: Package, iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { label: "Reserved Stock", value: summaryData.reservedStock.toLocaleString(), icon: Archive, iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
    { label: "Available Stock", value: summaryData.availableStock.toLocaleString(), icon: CheckCircle, iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    { label: "Stock Alerts", value: (summaryData.lowStockProducts + summaryData.outOfStockProducts).toLocaleString(), icon: AlertTriangle, iconColor: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Inventory Report"
        description="Current merchandise stock, reserved stock, available stock, and low-stock or out-of-stock indicators."
        category="Inventory"
        actions={<ExportButton onExport={handleExport} disabled={loading || data.length === 0} />}
        filters={
          <>
            {isSystemOwner && (
              <SystemOwnerClubFilter
                selectedClubId={selectedClubId}
                onChange={setSelectedClubId}
              />
            )}
            <ReportFilters initialFilters={filters} searchPlaceholder="Search product, SKU, category, tags..." onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} loading={loading}>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stock Status</Label>
              <Select value={filters.extras?.stockStatus || "all"} onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, stockStatus: val } }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Stock" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ReportFilters>
          </>
        }
        summary={<ReportSummaryCards cards={summaryCards} loading={loading} />}
      >
        <ReportTable columns={columns} data={data} loading={loading} pagination={pagination} sort={sort} onSortChange={setSort} onPageChange={setPage} emptyMessage="No inventory records found for the selected criteria." />
      </ReportShell>
    </DashboardLayout>
  )
}
