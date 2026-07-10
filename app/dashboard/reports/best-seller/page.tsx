"use client"

import { useCallback, useEffect, useState } from "react"
import { Trophy, CalendarDays, Package } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { buildReportQueryParams, shouldFetchReport, resolveExportClubId } from "@/lib/reportHelpers"
import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
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
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
}

interface BestSellerRow extends Record<string, unknown> {
  id: string
  ranking: number
  name: string
  unitsSold: number
  revenueGenerated: number
  fastMoving: boolean
  currency: string
}

export default function BestSellerReportPage() {
  const auth = useReportAuthorization("best-seller")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BestSellerRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({ featuredProducts: 0, unitsSold: 0, revenueGenerated: 0 })
  const [filters, setFilters] = useState<ReportFiltersState>({})
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({ field: "unitsSold", direction: "desc" })
  const [page, setPage] = useState(1)

  const fetchReport = useCallback(async () => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    setLoading(true)
    try {
      const queryParams: Record<string, any> = { clubId, page, limit: 20, sortBy: sort.field, sortDir: sort.direction }
      if (filters.search) queryParams.search = filters.search
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate

      const res = await apiClient.getBestSellerReport(queryParams)
      if (res.success && res.data) {
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)
        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            featuredProducts: Number(res.data.summary.featuredProducts) || 0,
            unitsSold: Number(res.data.summary.unitsSold) || 0,
            revenueGenerated: Number(res.data.summary.revenueGenerated) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load featured product sales report")
        setData([])
      }
    } catch {
      toast.error("Error loading featured product sales report")
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
      if (filters.search) queryParams.search = filters.search
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      const res = await apiClient.downloadBestSellerReport(queryParams)
      if (!res.success) toast.error(res.error || "Export failed")
      else toast.success(`Exported Featured Product Sales Report as ${format.toUpperCase()}`)
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
    { key: "name", header: "Product", accessor: "name", sortable: true, width: "w-64" },
    { key: "unitsSold", header: "Units Sold", accessor: "unitsSold", sortable: true, align: "center", width: "w-28" },
    { key: "revenueGenerated", header: "Revenue Generated", accessor: (row) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.revenueGenerated, row.currency)}</span>, sortable: true, align: "right", width: "w-40" },
    { key: "fastMoving", header: "Fast Moving (Y/N)", accessor: (row) => (row.fastMoving ? "Y" : "N"), align: "center", width: "w-28" },
  ]

  const summaryCards: SummaryCard[] = [
    { label: "Featured Products", value: summaryData.featuredProducts.toLocaleString() },
    { label: "Units Sold", value: summaryData.unitsSold.toLocaleString() },
    { label: "Revenue Generated", value: formatCurrency(summaryData.revenueGenerated) },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Featured Product Sales Report"
        description="Sales performance for Featured merchandise products only, ranked by units sold and revenue generated."
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
            <ReportFilters initialFilters={filters} searchPlaceholder="Search product..." onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} loading={loading} />
          </>
        }
        summary={<ReportSummaryCards cards={summaryCards} loading={loading} />}
      >
        <ReportTable columns={columns} data={data} loading={loading} pagination={pagination} sort={sort} onSortChange={setSort} onPageChange={setPage} emptyMessage="No featured product sales records found for the selected criteria." showClubColumn={isSystemOwner && !selectedClubId} />
      </ReportShell>
    </DashboardLayout>
  )
}
