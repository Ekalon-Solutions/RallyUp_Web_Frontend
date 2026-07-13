"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoppingCart, TrendingUp, CheckCircle } from "lucide-react"
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

function renderStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "active":
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    case "expired":
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    case "cancelled":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Cancelled</Badge>
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

function renderMembershipStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "renewal") {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Renewal</Badge>
  }
  return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">New</Badge>
}

interface MembershipPurchaseRow extends Record<string, unknown> {
  id: string
  purchaseId: string
  memberName: string
  email: string
  phoneNumber: string
  planName: string
  purchaseDate: string | null
  amount: number
  currency: string
  paymentStatus: string
  membershipStatus: string
  couponUsed: string
  rewardPointsUsed: number
}

interface PlanOption {
  id: string
  name: string
}

export default function MembershipPurchaseReportPage() {
  const auth = useReportAuthorization("membership-purchases")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MembershipPurchaseRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    membershipPurchases: 0,
    membershipRevenue: 0,
    averageMembershipValue: 0,
    activeMembershipPurchases: 0,
  })
  const [plans, setPlans] = useState<PlanOption[]>([])

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { membershipPlanId: "all" },
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

      if (filters.extras?.membershipPlanId && filters.extras.membershipPlanId !== "all") {
        queryParams.membershipPlanId = filters.extras.membershipPlanId
      }

      const res = await apiClient.getMembershipPurchaseReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data mapping
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            membershipPurchases: Number(res.data.summary.membershipPurchases) || 0,
            membershipRevenue: Number(res.data.summary.membershipRevenue) || 0,
            averageMembershipValue: Number(res.data.summary.averageMembershipValue) || 0,
            activeMembershipPurchases: Number(res.data.summary.activeMembershipPurchases) || 0,
          })
          if (res.data.summary.plans) {
            try {
              const parsed = typeof res.data.summary.plans === "string" ? JSON.parse(res.data.summary.plans) : res.data.summary.plans
              if (Array.isArray(parsed)) setPlans(parsed)
            } catch {}
          }
        }
      } else {
        toast.error(res.message || "Failed to load purchase report")
        setData([])
      }
    } catch {
      toast.error("Error loading membership purchase report")
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
    setFilters({ extras: { membershipPlanId: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { format, ...resolveExportClubId({ clubId, selectedClubId, isSystemOwner }) }
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status) queryParams.status = filters.status
      if (filters.extras?.membershipPlanId && filters.extras.membershipPlanId !== "all") {
        queryParams.membershipPlanId = filters.extras.membershipPlanId
      }

      const res = await apiClient.downloadMembershipPurchaseReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Membership Purchases as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<MembershipPurchaseRow>[] = [
    {
      key: "purchaseId",
      header: "Purchase ID",
      accessor: (row) => <span className="font-mono text-xs font-medium">{row.purchaseId}</span>,
      width: "w-36",
    },
    {
      key: "memberName",
      header: "Member",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.memberName}</div>
          <div className="text-[11px] text-muted-foreground">{row.email}</div>
        </div>
      ),
      width: "w-48",
    },
    {
      key: "phoneNumber",
      header: "Contact Number",
      accessor: "phoneNumber",
      width: "w-36",
    },
    {
      key: "planName",
      header: "Membership Plan",
      accessor: "planName",
      width: "w-44",
    },
    {
      key: "createdAt",
      header: "Purchase Date/Time",
      accessor: (row) => (row.purchaseDate ? new Date(row.purchaseDate).toLocaleString("en-IN") : "—"),
      sortable: true,
      width: "w-44",
    },
    {
      key: "amount",
      header: "Amount",
      accessor: (row) => (
        <span className="font-mono font-semibold">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
      align: "right",
      width: "w-32",
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      accessor: (row) =>
        row.amount === 0
          ? <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300 border-0 font-medium">Free</Badge>
          : renderStatusBadge(row.paymentStatus),
      width: "w-32",
    },
    {
      key: "status",
      header: "Status (New, Renewal)",
      accessor: (row) => renderMembershipStatusBadge(row.membershipStatus),
      sortable: true,
      width: "w-36",
    },
    {
      key: "couponUsed",
      header: "Coupon Used",
      accessor: "couponUsed",
      width: "w-32",
    },
    {
      key: "rewardPointsUsed",
      header: "Reward Points Used",
      accessor: (row) => String(row.rewardPointsUsed),
      align: "right",
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Membership Purchases",
      value: summaryData.membershipPurchases.toLocaleString(),
    },
    {
      label: "Membership Revenue",
      value: formatCurrency(summaryData.membershipRevenue),
    },
    {
      label: "Average Value",
      value: formatCurrency(summaryData.averageMembershipValue),
    },
    {
      label: "Active Purchases",
      value: summaryData.activeMembershipPurchases.toLocaleString(),
    },
  ]

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
    { value: "pending", label: "Pending" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Membership Purchase Report"
        description="Detailed record of membership plan purchases, gross revenue, average plan values, and payment statuses."
        category="Lifecycle"
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
            statusLabel="Payment / Status"
            searchPlaceholder="Search purchase ID, member name, email..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {plans.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Membership Plan</Label>
                <Select
                  value={filters.extras?.membershipPlanId || "all"}
                  onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, membershipPlanId: val } }))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
          emptyMessage="No membership purchase records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
