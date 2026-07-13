"use client"

import { useCallback, useEffect, useState } from "react"
import { Ticket, Tag, TrendingUp } from "lucide-react"
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

function renderPaymentStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "confirmed":
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Confirmed</Badge>
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Pending</Badge>
    case "cancelled":
    case "refunded":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    default:
      return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }
}

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

interface EventTicketSalesRow extends Record<string, unknown> {
  id: string
  orderId: string
  eventTitle: string
  eventId: string
  memberName: string
  memberEmail: string
  mobileNumber: string
  venueName: string
  registrationDate: string
  tierName: string
  amountPaid: number
  discountApplied: number
  clubFees: number
  memberOrAttendee: string
  platformFeesInclGst: number
  razorpayFeesInclGst: number
  taxes: number
  couponUsed: string
  rewardPointsUsed: number
  paymentStatus: string
  currency: string
}

interface EventOption {
  value: string
  label: string
}

export default function EventTicketSalesReportPage() {
  const auth = useReportAuthorization("event-ticket-sales")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EventTicketSalesRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    ticketsSold: 0,
    grossRevenue: 0,
    totalDiscounts: 0,
    netRevenue: 0,
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
    field: "registrations.registrationDate",
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

      const res = await apiClient.getEventTicketSalesReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            ticketsSold: Number(res.data.summary.ticketsSold) || 0,
            grossRevenue: Number(res.data.summary.grossRevenue) || 0,
            totalDiscounts: Number(res.data.summary.totalDiscounts) || 0,
            netRevenue: Number(res.data.summary.netRevenue) || 0,
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
        toast.error(res.message || "Failed to load event ticket sales report")
        setData([])
      }
    } catch {
      toast.error("Error loading event ticket sales report")
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
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status && filters.status !== "all") queryParams.status = filters.status
      if (filters.extras?.eventId && filters.extras.eventId !== "all") {
        queryParams.eventId = filters.extras.eventId
      }

      const res = await apiClient.downloadEventTicketSalesReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Event Ticket Sales as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<EventTicketSalesRow>[] = [
    {
      key: "orderId",
      header: "Order ID",
      accessor: (row) => <span className="font-mono text-xs">{row.orderId || "N/A"}</span>,
      width: "w-36",
    },
    {
      key: "memberName",
      header: "Name",
      accessor: "memberName",
      width: "w-36",
    },
    {
      key: "mobileNumber",
      header: "Mobile Number",
      accessor: "mobileNumber",
      width: "w-32",
    },
    {
      key: "memberEmail",
      header: "Email",
      accessor: "memberEmail",
      width: "w-44",
    },
    {
      key: "title",
      header: "Event Name",
      accessor: "eventTitle",
      sortable: true,
      width: "w-48",
    },
    {
      key: "venueName",
      header: "Venue Name",
      accessor: "venueName",
      width: "w-36",
    },
    {
      key: "registrationDate",
      header: "Ticket Purchase Date/Time",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.registrationDate ? row.registrationDate.replace("T", " ").slice(0, 16) : "—"}
        </span>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "tierName",
      header: "Ticket Tier",
      accessor: "tierName",
      width: "w-32",
    },
    {
      key: "amountPaid",
      header: "Amount Paid",
      accessor: (row) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.amountPaid, row.currency)}
        </span>
      ),
      align: "right",
      width: "w-32",
    },
    {
      key: "discountApplied",
      header: "Discount",
      accessor: (row) => (
        <span className="font-mono text-xs text-rose-600 dark:text-rose-400">
          {formatCurrency(row.discountApplied, row.currency)}
        </span>
      ),
      align: "right",
      width: "w-28",
    },
    {
      key: "clubFees",
      header: "Club Fees",
      accessor: (row) => (
        <span className="font-mono text-xs">{formatCurrency(row.clubFees, row.currency)}</span>
      ),
      align: "right",
      width: "w-28",
    },
    {
      key: "memberOrAttendee",
      header: "Member/Attendee",
      accessor: (row) => <Badge variant="outline">{row.memberOrAttendee}</Badge>,
      width: "w-28",
    },
    {
      key: "platformFeesInclGst",
      header: "Platform Fees (incl GST)",
      accessor: (row) => (
        <span className="font-mono text-xs">{formatCurrency(row.platformFeesInclGst, row.currency)}</span>
      ),
      align: "right",
      width: "w-32",
    },
    {
      key: "razorpayFeesInclGst",
      header: "Razorpay Fees (incl. GST)",
      accessor: (row) => (
        <span className="font-mono text-xs">{formatCurrency(row.razorpayFeesInclGst, row.currency)}</span>
      ),
      align: "right",
      width: "w-32",
    },
    {
      key: "taxes",
      header: "Taxes",
      accessor: (row) => <span className="font-mono text-xs">{formatCurrency(row.taxes, row.currency)}</span>,
      align: "right",
      width: "w-24",
    },
    {
      key: "couponUsed",
      header: "Coupon Used",
      accessor: "couponUsed",
      width: "w-28",
    },
    {
      key: "rewardPointsUsed",
      header: "Reward Points Used",
      accessor: "rewardPointsUsed",
      align: "center",
      width: "w-28",
    },
    {
      key: "paymentStatus",
      header: "Status",
      accessor: (row) =>
        row.amountPaid === 0
          ? <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300 border-0 font-medium">Free</Badge>
          : renderPaymentStatusBadge(row.paymentStatus),
      width: "w-32",
    },
  ]

const summaryCards: SummaryCard[] = [
    {
      label: "Tickets Sold",
      value: summaryData.ticketsSold.toLocaleString(),
    },
    {
      label: "Gross Revenue",
      value: formatCurrency(summaryData.grossRevenue),
    },
    {
      label: "Total Discounts",
      value: formatCurrency(summaryData.totalDiscounts),
    },
    {
      label: "Net Revenue",
      value: formatCurrency(summaryData.netRevenue),
    },
  ]

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Event Ticket Sales Report"
        description="Per-ticket breakdown of event registrations, revenue, fees, and discounts."
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
            statusOptions={statusOptions}
            statusLabel="Status"
            searchPlaceholder="Search event title, member name, email, payment ID..."
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
          emptyMessage="No event ticket sales records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
