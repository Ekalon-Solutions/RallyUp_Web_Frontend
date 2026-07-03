"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoppingCart, DollarSign, TrendingUp, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LockedFeaturePage } from "@/components/feature-gate"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
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
} from "@/components/reports"

function renderStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "active":
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">{status}</Badge>
    case "expired":
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">{status}</Badge>
    case "cancelled":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Cancelled</Badge>
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

interface MembershipPurchaseRow extends Record<string, unknown> {
  id: string
  purchaseId: string
  memberName: string
  email: string
  planName: string
  purchaseDate: string | null
  amount: number
  currency: string
  paymentStatus: string
  membershipStatus: string
}

interface PlanOption {
  id: string
  name: string
}

export default function MembershipPurchaseReportPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)

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
    if (!clubId) return
    setLoading(true)
    try {
      const queryParams: Record<string, any> = {
        clubId,
        page,
        limit: 20,
        sortBy: sort.field,
        sortDir: sort.direction,
      }

      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status && filters.status !== "all") queryParams.status = filters.status
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
  }, [clubId, page, sort, filters])

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
    if (!clubId) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      if (filters.search) queryParams.search = filters.search
      if (filters.status && filters.status !== "all") queryParams.status = filters.status
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

  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isFeatureEnabled(clubFeatureConfig, "reporting")) {
    return (
      <DashboardLayout>
        <LockedFeaturePage
          featureKey="reporting"
          featureLabel="Membership Purchase Report"
          clubId={clubId ?? ""}
          currentTier={clubFeatureConfig?.billing_tier}
        />
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
      key: "planName",
      header: "Membership Plan",
      accessor: "planName",
      width: "w-44",
    },
    {
      key: "createdAt",
      header: "Purchase Date",
      accessor: (row) => (row.purchaseDate ? row.purchaseDate.slice(0, 10) : "—"),
      sortable: true,
      width: "w-36",
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
      accessor: (row) => renderStatusBadge(row.paymentStatus),
      width: "w-32",
    },
    {
      key: "status",
      header: "Membership Status",
      accessor: (row) => renderStatusBadge(row.membershipStatus),
      sortable: true,
      width: "w-36",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Membership Purchases",
      value: summaryData.membershipPurchases.toLocaleString(),
      icon: ShoppingCart,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Membership Revenue",
      value: formatCurrency(summaryData.membershipRevenue),
      icon: DollarSign,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Average Value",
      value: formatCurrency(summaryData.averageMembershipValue),
      icon: TrendingUp,
      iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
    {
      label: "Active Purchases",
      value: summaryData.activeMembershipPurchases.toLocaleString(),
      icon: CheckCircle,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
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
        />
      </ReportShell>
    </DashboardLayout>
  )
}
