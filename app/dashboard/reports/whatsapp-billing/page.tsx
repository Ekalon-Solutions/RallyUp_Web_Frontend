"use client"

import { useCallback, useEffect, useState } from "react"
import { MessageSquare, DollarSign, Receipt, Clock } from "lucide-react"
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

function renderWhatsAppStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "issued":
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Issued / Settled</Badge>
    case "draft":
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Draft (Pending)</Badge>
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

interface WhatsAppBillingRow extends Record<string, unknown> {
  id: string
  invoiceNumber: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  marketingMessageCount: number
  ratePerMessage: number
  baseAmount: number
  gstAmount: number
  totalAmount: number
  currency: string
  status: string
  createdAt: string
}

export default function WhatsAppBillingReportPage() {
  const auth = useReportAuthorization("whatsapp-billing")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WhatsAppBillingRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalInvoices: 0,
    totalMessagesSent: 0,
    baseAmount: 0,
    totalAmount: 0,
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


      const res = await apiClient.getWhatsAppBillingReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalInvoices: Number(res.data.summary.totalInvoices) || 0,
            totalMessagesSent: Number(res.data.summary.totalMessagesSent) || 0,
            baseAmount: Number(res.data.summary.baseAmount) || 0,
            totalAmount: Number(res.data.summary.totalAmount) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load WhatsApp billing report")
        setData([])
      }
    } catch {
      toast.error("Error loading WhatsApp billing report")
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

      const res = await apiClient.downloadWhatsAppBillingReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported WhatsApp Billing as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<WhatsAppBillingRow>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice Number",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.invoiceNumber}</span>,
      width: "w-40",
    },
    {
      key: "periodLabel",
      header: "Period",
      accessor: (row) => <span className="font-mono text-xs font-semibold">{row.periodLabel}</span>,
      width: "w-28",
    },
    {
      key: "marketingMessageCount",
      header: "Messages Sent",
      accessor: (row) => <span className="font-mono font-medium">{row.marketingMessageCount.toLocaleString()}</span>,
      sortable: true,
      align: "center",
      width: "w-36",
    },
    {
      key: "ratePerMessage",
      header: "Rate / Msg",
      accessor: (row) => <span className="font-mono text-xs text-muted-foreground">{formatCurrency(row.ratePerMessage, row.currency)}</span>,
      align: "right",
      width: "w-28",
    },
    {
      key: "baseAmount",
      header: "Base Amount",
      accessor: (row) => <span className="font-mono text-xs">{formatCurrency(row.baseAmount, row.currency)}</span>,
      align: "right",
      width: "w-32",
    },
    {
      key: "gstAmount",
      header: "GST (18%)",
      accessor: (row) => <span className="font-mono text-xs text-muted-foreground">{formatCurrency(row.gstAmount, row.currency)}</span>,
      align: "right",
      width: "w-28",
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      accessor: (row) => <span className="font-mono font-semibold">{formatCurrency(row.totalAmount, row.currency)}</span>,
      sortable: true,
      align: "right",
      width: "w-36",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => renderWhatsAppStatusBadge(row.status),
      sortable: true,
      width: "w-36",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Invoices",
      value: summaryData.totalInvoices.toLocaleString(),
      icon: Receipt,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Messages Sent",
      value: summaryData.totalMessagesSent.toLocaleString(),
      icon: MessageSquare,
      iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
    {
      label: "Base Charges Amount",
      value: formatCurrency(summaryData.baseAmount),
      icon: DollarSign,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Total Amount (Inc. GST)",
      value: formatCurrency(summaryData.totalAmount),
      icon: Clock,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
  ]

  const statusOptions = [
    { value: "issued", label: "Issued / Settled" },
    { value: "draft", label: "Draft (Pending)" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="WhatsApp Billing Report"
        description="Detailed record of WhatsApp marketing message volume, per-message rates, GST calculations, and monthly settlement statements."
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
            statusLabel="Invoice Status"
            searchPlaceholder="Search invoice number, period, settlement note..."
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
          emptyMessage="No WhatsApp billing records found for the selected criteria."
        />
      </ReportShell>
    </DashboardLayout>
  )
}
