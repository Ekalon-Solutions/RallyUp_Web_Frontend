"use client"

import { useCallback, useEffect, useState } from "react"
import { Ticket, CheckCircle, Clock, FileText } from "lucide-react"
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

function renderExternalTicketStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "fulfilled":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Fulfilled</Badge>
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Pending</Badge>
    case "on_hold":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">On Hold</Badge>
    case "rejected":
    case "cancelled_by_member":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status.replace(/_/g, ' ')}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

interface ExternalTicketRow extends Record<string, unknown> {
  id: string
  userName: string
  phone: string
  competition: string
  preferredDate: string | null
  tickets: number
  status: string
  requestedDate: string
  comments: string
}

export default function ExternalTicketReportPage() {
  const auth = useReportAuthorization("external-tickets")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ExternalTicketRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalRequests: 0,
    totalTickets: 0,
    fulfilledRequests: 0,
    pendingRequests: 0,
  })

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { competition: "all" },
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

      if (filters.extras?.competition && filters.extras.competition !== "all") {
        queryParams.competition = filters.extras.competition
      }

      const res = await apiClient.getExternalTicketReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalRequests: Number(res.data.summary.totalRequests) || 0,
            totalTickets: Number(res.data.summary.totalTickets) || 0,
            fulfilledRequests: Number(res.data.summary.fulfilledRequests) || 0,
            pendingRequests: Number(res.data.summary.pendingRequests) || 0,
          })
        }
      } else {
        toast.error(res.message || "Failed to load external tickets report")
        setData([])
      }
    } catch {
      toast.error("Error loading external ticket report")
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
    setFilters({ extras: { competition: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.competition && filters.extras.competition !== "all") {
        queryParams.competition = filters.extras.competition
      }

      const res = await apiClient.downloadExternalTicketReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported External Tickets as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<ExternalTicketRow>[] = [
    {
      key: "id",
      header: "Request ID",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.id.slice(-8)}</span>,
      width: "w-28",
    },
    {
      key: "userName",
      header: "User Name",
      accessor: "userName",
      width: "w-44",
    },
    {
      key: "phone",
      header: "Phone",
      accessor: "phone",
      width: "w-36",
    },
    {
      key: "competition",
      header: "Competition / Fixture",
      accessor: "competition",
      width: "w-48",
    },
    {
      key: "preferredDate",
      header: "Preferred Date",
      accessor: (row) => (row.preferredDate ? row.preferredDate.slice(0, 10) : "N/A"),
      width: "w-36",
    },
    {
      key: "tickets",
      header: "Tickets",
      accessor: "tickets",
      sortable: true,
      align: "center",
      width: "w-20",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => renderExternalTicketStatusBadge(row.status),
      sortable: true,
      width: "w-32",
    },
    {
      key: "createdAt",
      header: "Requested Date",
      accessor: (row) => (row.requestedDate ? row.requestedDate.replace("T", " ").slice(0, 16) : "â€”"),
      sortable: true,
      width: "w-40",
    },
    {
      key: "comments",
      header: "Comments",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-full block" title={row.comments}>
          {row.comments || "â€”"}
        </span>
      ),
      width: "w-48",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Requests",
      value: summaryData.totalRequests.toLocaleString(),
    },
    {
      label: "Total Tickets Requested",
      value: summaryData.totalTickets.toLocaleString(),
    },
    {
      label: "Fulfilled Requests",
      value: summaryData.fulfilledRequests.toLocaleString(),
    },
    {
      label: "Pending Requests",
      value: summaryData.pendingRequests.toLocaleString(),
    },
  ]

  const externalStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "on_hold", label: "On Hold" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled_by_member", label: "Cancelled by Member" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="External Ticket Report"
        description="Comprehensive log of external match/event ticket requests submitted by members, fulfillment statuses, and preferred dates."
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
            statusOptions={externalStatusOptions}
            statusLabel="Request Status"
            searchPlaceholder="Search user name, phone, competition, comments..."
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
          emptyMessage="No external ticket requests found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
