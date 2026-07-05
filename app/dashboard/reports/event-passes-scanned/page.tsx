"use client"

import { useCallback, useEffect, useState } from "react"
import { Ticket, QrCode, CheckCircle, UserX } from "lucide-react"
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

interface EventPassesScannedRow extends Record<string, unknown> {
  id: string
  eventTitle: string
  eventDate: string
  venue: string
  ticketsSold: number
  passesScanned: number
  attendanceRate: number
  noShowCount: number
  status: string
}

interface EventOption {
  value: string
  label: string
}

export default function EventPassesScannedReportPage() {
  const auth = useReportAuthorization("event-passes-scanned")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EventPassesScannedRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalSold: 0,
    totalScanned: 0,
    attendanceRate: 0,
    noShowRate: 0,
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
    field: "startTime",
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

      const res = await apiClient.getEventPassesScannedReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalSold: Number(res.data.summary.totalSold) || 0,
            totalScanned: Number(res.data.summary.totalScanned) || 0,
            attendanceRate: Number(res.data.summary.attendanceRate) || 0,
            noShowRate: Number(res.data.summary.noShowRate) || 0,
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
        toast.error(res.message || "Failed to load passes scanned report")
        setData([])
      }
    } catch {
      toast.error("Error loading event passes scanned report")
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
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.eventId && filters.extras.eventId !== "all") {
        queryParams.eventId = filters.extras.eventId
      }

      const res = await apiClient.downloadEventPassesScannedReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Event Passes Scanned as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<EventPassesScannedRow>[] = [
    {
      key: "startTime",
      header: "Event Title",
      accessor: "eventTitle",
      sortable: true,
      width: "w-56",
    },
    {
      key: "eventDate",
      header: "Event Date",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.eventDate ? row.eventDate.replace("T", " ").slice(0, 16) : "—"}
        </span>
      ),
      width: "w-40",
    },
    {
      key: "venue",
      header: "Venue",
      accessor: "venue",
      width: "w-44",
    },
    {
      key: "ticketsSold",
      header: "Tickets Sold",
      accessor: (row) => <span className="font-mono font-medium">{row.ticketsSold.toLocaleString()}</span>,
      sortable: true,
      align: "center",
      width: "w-32",
    },
    {
      key: "passesScanned",
      header: "Passes Scanned",
      accessor: (row) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{row.passesScanned.toLocaleString()}</span>,
      align: "center",
      width: "w-36",
    },
    {
      key: "attendanceRate",
      header: "Attendance %",
      accessor: (row) => (
        <Badge className={row.attendanceRate >= 75 ? "bg-emerald-100 text-emerald-800 border-0" : "bg-amber-100 text-amber-800 border-0"}>
          {row.attendanceRate.toFixed(1)}%
        </Badge>
      ),
      align: "center",
      width: "w-36",
    },
    {
      key: "noShowCount",
      header: "No-show Count",
      accessor: (row) => <span className="font-mono text-xs text-rose-600 dark:text-rose-400">{row.noShowCount.toLocaleString()}</span>,
      align: "center",
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Tickets Sold",
      value: summaryData.totalSold.toLocaleString(),
    },
    {
      label: "Total Passes Scanned",
      value: summaryData.totalScanned.toLocaleString(),
    },
    {
      label: "Attendance Rate",
      value: `${summaryData.attendanceRate.toFixed(1)}%`,
    },
    {
      label: "No-show Rate",
      value: `${summaryData.noShowRate.toFixed(1)}%`,
    },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Event Passes Sold vs Scanned Report"
        description="Tracks ticket turnout, vendor QR scan counts, real-time venue check-ins, and no-show percentages across events."
        category="Events"
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
            searchPlaceholder="Search event title, venue..."
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
          emptyMessage="No event attendance scan records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
