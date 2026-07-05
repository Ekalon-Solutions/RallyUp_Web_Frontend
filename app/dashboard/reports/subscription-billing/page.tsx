"use client"

import { useCallback, useEffect, useState } from "react"
import { CreditCard, CheckCircle, Clock } from "lucide-react"
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

function renderBillingStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Paid</Badge>
    case "pending":
    case "draft":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">{status}</Badge>
    case "void":
    case "overdue":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status}</Badge>
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

interface SubscriptionBillingRow extends Record<string, unknown> {
  id: string
  invoiceNumber: string
  invoiceType: string
  baseTier: string
  periodStart: string
  periodEnd: string
  baseTierAmount: number
  addonsAmount: number
  totalAmount: number
  currency: string
  status: string
  createdAt: string
}

export default function SubscriptionBillingReportPage() {
  const auth = useReportAuthorization("subscription-billing")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SubscriptionBillingRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalInvoices: 0,
    totalBilledAmount: 0,
    paidInvoices: 0,
    pendingAmount: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { invoiceType: "all" },
  })

  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "created_at",
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

      if (filters.extras?.invoiceType && filters.extras.invoiceType !== "all") {
        queryParams.invoiceType = filters.extras.invoiceType
      }

      const res = await apiClient.getSubscriptionBillingReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalInvoices: Number(res.data.summary.totalInvoices) || 0,
            totalBilledAmount: Number(res.data.summary.totalBilledAmount) || 0,
            paidInvoices: Number(res.data.summary.paidInvoices) || 0,
            pendingAmount: Number(res.data.summary.pendingAmount) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load subscription billing report")
        setData([])
      }
    } catch {
      toast.error("Error loading subscription billing report")
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
    setFilters({ extras: { invoiceType: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.invoiceType && filters.extras.invoiceType !== "all") {
        queryParams.invoiceType = filters.extras.invoiceType
      }

      const res = await apiClient.downloadSubscriptionBillingReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Subscription Billing as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<SubscriptionBillingRow>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice Number",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.invoiceNumber}</span>,
      width: "w-40",
    },
    {
      key: "invoiceType",
      header: "Invoice Type",
      accessor: (row) => <span className="text-xs font-medium">{row.invoiceType.replace(/_/g, ' ')}</span>,
      width: "w-44",
    },
    {
      key: "baseTier",
      header: "Base Tier",
      accessor: (row) => <span className="font-medium text-xs text-purple-600 dark:text-purple-400 capitalize">{row.baseTier}</span>,
      width: "w-32",
    },
    {
      key: "periodStart",
      header: "Billing Period",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.periodStart ? row.periodStart.slice(0, 10) : "N/A"} → {row.periodEnd ? row.periodEnd.slice(0, 10) : "N/A"}
        </span>
      ),
      width: "w-48",
    },
    {
      key: "baseTierAmount",
      header: "Base Amount",
      accessor: (row) => <span className="font-mono text-xs">{formatCurrency(row.baseTierAmount)}</span>,
      align: "right",
      width: "w-32",
    },
    {
      key: "addonsAmount",
      header: "Addons",
      accessor: (row) => <span className="font-mono text-xs">{formatCurrency(row.addonsAmount)}</span>,
      align: "right",
      width: "w-28",
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      accessor: (row) => <span className="font-mono font-semibold">{formatCurrency(row.totalAmount)}</span>,
      sortable: true,
      align: "right",
      width: "w-36",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => renderBillingStatusBadge(row.status),
      sortable: true,
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Invoices",
      value: summaryData.totalInvoices.toLocaleString(),
    },
    {
      label: "Total Billed Amount",
      value: formatCurrency(summaryData.totalBilledAmount),
    },
    {
      label: "Paid Invoices",
      value: summaryData.paidInvoices.toLocaleString(),
    },
    {
      label: "Pending / Draft Amount",
      value: formatCurrency(summaryData.pendingAmount),
    },
  ]

  const statusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "draft", label: "Draft" },
    { value: "void", label: "Void" },
  ]

  const invoiceTypeOptions = [
    { value: "monthly_summary", label: "Monthly Summary" },
    { value: "tier_change", label: "Tier Change" },
    { value: "addon_activation", label: "Addon Activation" },
    { value: "prorated_feature_change", label: "Prorated Feature Change" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Subscription Billing Report"
        description="Comprehensive summary of platform SaaS subscription invoices, tier changes, add-on charges, and settlement statuses."
        category="Billing"
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
            statusLabel="Payment Status"
            searchPlaceholder="Search invoice number, club, tier..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Invoice Type</Label>
              <Select
                value={filters.extras?.invoiceType || "all"}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, invoiceType: val } }))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {invoiceTypeOptions.map((opt) => (
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
          emptyMessage="No subscription billing records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
