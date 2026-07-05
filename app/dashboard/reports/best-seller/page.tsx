"use client"

import { useCallback, useEffect, useState } from "react"
import { Trophy, CalendarDays, Package } from "lucide-react"
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

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency === "USD" ? "USD" : "INR", maximumFractionDigits: 2 }).format(amount)
}

interface BestSellerRow extends Record<string, unknown> {
  id: string
  ranking: number
  itemType: "product" | "event"
  name: string
  unitsSold: number
  revenueGenerated: number
  currency: string
}

export default function BestSellerReportPage() {
  const auth = useReportAuthorization("best-seller")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BestSellerRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({ bestSellingProducts: 0, bestSellingEvents: 0, unitsSold: 0, revenueGenerated: 0 })
  const [filters, setFilters] = useState<ReportFiltersState>({ extras: { itemType: "all" } })
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({ field: "unitsSold", direction: "desc" })
  const [page, setPage] = useState(1)

  const fetchReport = useCallback(async () => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    setLoading(true)
    try {
      const queryParams: Record<string, any> = { clubId, page, limit: 20, sortBy: sort.field, sortDir: sort.direction }
      if (filters.extras?.itemType && filters.extras.itemType !== "all") queryParams.itemType = filters.extras.itemType

      const res = await apiClient.getBestSellerReport(queryParams)
      if (res.success && res.data) {
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)
        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            bestSellingProducts: Number(res.data.summary.bestSellingProducts) || 0,
            bestSellingEvents: Number(res.data.summary.bestSellingEvents) || 0,
            unitsSold: Number(res.data.summary.unitsSold) || 0,
            revenueGenerated: Number(res.data.summary.revenueGenerated) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load best seller report")
        setData([])
      }
    } catch {
      toast.error("Error loading best seller report")
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
    setFilters({ extras: { itemType: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.itemType && filters.extras.itemType !== "all") queryParams.itemType = filters.extras.itemType
      const res = await apiClient.downloadBestSellerReport(queryParams)
      if (!res.success) toast.error(res.error || "Export failed")
      else toast.success(`Exported Best Seller as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<BestSellerRow>[] = [
    { key: "ranking", header: "Rank", accessor: (row) => <span className="font-mono text-xs font-semibold">#{row.ranking}</span>, sortable: true, align: "center", width: "w-20" },
    { key: "itemType", header: "Type", accessor: (row) => <Badge variant="outline">{row.itemType === "event" ? "Event" : "Product"}</Badge>, width: "w-24" },
    { key: "name", header: "Product / Event", accessor: "name", sortable: true, width: "w-64" },
    { key: "unitsSold", header: "Units Sold", accessor: "unitsSold", sortable: true, align: "center", width: "w-28" },
    { key: "revenueGenerated", header: "Revenue Generated", accessor: (row) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.revenueGenerated, row.currency)}</span>, sortable: true, align: "right", width: "w-40" },
  ]

  const summaryCards: SummaryCard[] = [
    { label: "Ranked Items", value: (summaryData.bestSellingProducts + summaryData.bestSellingEvents).toLocaleString() },
    { label: "Best Selling Products", value: summaryData.bestSellingProducts.toLocaleString() },
    { label: "Best Selling Events", value: summaryData.bestSellingEvents.toLocaleString() },
    { label: "Revenue Generated", value: formatCurrency(summaryData.revenueGenerated) },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Best Seller Report"
        description="Ranking of merchandise products and ticketed events by units sold and revenue generated."
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
            <ReportFilters initialFilters={filters} searchPlaceholder="Search product or event..." onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} loading={loading}>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={filters.extras?.itemType || "all"} onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, itemType: val } }))}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ReportFilters>
          </>
        }
        summary={<ReportSummaryCards cards={summaryCards} loading={loading} />}
      >
        <ReportTable columns={columns} data={data} loading={loading} pagination={pagination} sort={sort} onSortChange={setSort} onPageChange={setPage} emptyMessage="No best seller records found for the selected criteria." showClubColumn={isSystemOwner && !selectedClubId} />
      </ReportShell>
    </DashboardLayout>
  )
}
