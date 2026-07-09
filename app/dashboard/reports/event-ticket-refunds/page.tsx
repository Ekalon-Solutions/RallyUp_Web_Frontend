"use client"

import { useCallback, useEffect, useState } from "react"
import { RotateCcw, CheckCircle, Clock } from "lucide-react"
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

function renderRefundStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "processed":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Approved / Processed</Badge>
    case "requested":
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Pending</Badge>
    case "rejected":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Rejected</Badge>
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

interface EventTicketRefundRow extends Record<string, unknown> {
  id: string
  refundId: string
  eventTitle: string
  eventId: string | null
  memberName: string
  memberEmail: string
  refundAmount: number
  currency: string
  status: string
  requestedDate: string
  processedDate: string | null
  processedBy: string | null
}

interface EventOption {
  value: string
  label: string
}

export default function EventTicketRefundsReportPage() {
  const auth = useReportAuthorization("event-ticket-refunds")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EventTicketRefundRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalRefunds: 0,
    totalRefundedAmount: 0,
    approvedRefunds: 0,
    pendingRefunds: 0,
  })
  const [eventOptions, setEventOptions] = useState<EventOption[]>([])

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { eventId: "all" },
  })

  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "requestedAt",
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

      if (filters.extras?.eventId && filters.extras.eventId !== "all") {
        queryParams.eventId = filters.extras.eventId
      }

      const res = await apiClient.getEventTicketRefundsReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalRefunds: Number(res.data.summary.totalRefunds) || 0,
            totalRefundedAmount: Number(res.data.summary.totalRefundedAmount) || 0,
            approvedRefunds: Number(res.data.summary.approvedRefunds) || 0,
            pendingRefunds: Number(res.data.summary.pendingRefunds) || 0,
          })
          if (res.data.summary.eventOptions) {
            try {
              const parsed = typeof res.data.summary.eventOptions === "string"
                ? JSON.parse(res.data.summary.eventOptions)
                : res.data.summary.eventOptions
              if (Array.isArray(parsed)) setEventOptions(parsed)
            } catch {}
          }
        }
      } else {
        toast.error(res.message || "Failed to load event ticket refunds")
        setData([])
      }
    } catch {
      toast.error("Error loading event ticket refunds report")
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
    setFilters({ extras: { eventId: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { format, ...resolveExportClubId({ clubId, selectedClubId, isSystemOwner }) }
      if (filters.extras?.eventId && filters.extras.eventId !== "all") {
        queryParams.eventId = filters.extras.eventId
      }

      const res = await apiClient.downloadEventTicketRefundsReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Event Ticket Refunds as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<EventTicketRefundRow>[] = [
    {
      key: "refundId",
      header: "Refund ID",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.refundId}</span>,
      width: "w-36",
    },
    {
      key: "event.title",
      header: "Event",
      accessor: "eventTitle",
      sortable: true,
      width: "w-48",
    },
    {
      key: "memberName",
      header: "Member",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.memberName}</div>
          <div className="text-[11px] text-muted-foreground">{row.memberEmail}</div>
        </div>
      ),
      width: "w-48",
    },
    {
      key: "estimatedRefund",
      header: "Refund Amount",
      accessor: (row) => (
        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
          {formatCurrency(row.refundAmount, row.currency)}
        </span>
      ),
      sortable: true,
      align: "right",
      width: "w-36",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => renderRefundStatusBadge(row.status),
      sortable: true,
      width: "w-36",
    },
    {
      key: "requestedAt",
      header: "Requested Date",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.requestedDate ? row.requestedDate.replace("T", " ").slice(0, 16) : "—"}
        </span>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "processedDate",
      header: "Processed Date",
      accessor: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.processedDate ? row.processedDate.replace("T", " ").slice(0, 16) : "N/A"}
        </span>
      ),
      width: "w-40",
    },
    {
      key: "processedBy",
      header: "Processed By",
      accessor: (row) => <span className="text-xs text-muted-foreground">{row.processedBy || "N/A"}</span>,
      width: "w-36",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Ticket Refunds",
      value: summaryData.totalRefunds.toLocaleString(),
    },
    {
      label: "Total Refunded Amount",
      value: formatCurrency(summaryData.totalRefundedAmount),
    },
    {
      label: "Approved Refunds",
      value: summaryData.approvedRefunds.toLocaleString(),
    },
    {
      label: "Pending Refunds",
      value: summaryData.pendingRefunds.toLocaleString(),
    },
  ]

  const refundStatusOptions = [
    { value: "requested", label: "Requested (Pending)" },
    { value: "processed", label: "Approved / Processed" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Event Ticket Refund Log"
        description="Audit log of all event ticket refund requests, approval statuses, processed amounts, and processing admins."
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
            statusOptions={refundStatusOptions}
            statusLabel="Refund Status"
            searchPlaceholder="Search Refund ID, event, member name, email..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {eventOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Event</Label>
                <Select
                  value={filters.extras?.eventId || "all"}
                  onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, eventId: val } }))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {eventOptions.map((evt) => (
                      <SelectItem key={evt.value} value={evt.value}>{evt.label}</SelectItem>
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
          emptyMessage="No event ticket refund records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
