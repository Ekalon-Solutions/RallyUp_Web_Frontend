"use client"

import { useCallback, useEffect, useState } from "react"
import { UserPlus, RefreshCw, UserX, TrendingUp } from "lucide-react"
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
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Active</Badge>
    case "expired":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Expired</Badge>
    case "cancelled":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

interface MembershipGrowthRow extends Record<string, unknown> {
  id: string
  userMembershipId: string
  memberName: string
  email: string
  planName: string
  joinedDate: string | null
  renewalDate: string | null
  expiryDate: string | null
  status: string
}

interface PlanOption {
  id: string
  name: string
}

export default function MembershipGrowthReportPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MembershipGrowthRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    newMembers: 0,
    renewedMembers: 0,
    expiredMemberships: 0,
    netGrowth: 0,
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
    field: "start_date",
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

      const res = await apiClient.getMembershipGrowthReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data mapping
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            newMembers: Number(res.data.summary.newMembers) || 0,
            renewedMembers: Number(res.data.summary.renewedMembers) || 0,
            expiredMemberships: Number(res.data.summary.expiredMemberships) || 0,
            netGrowth: Number(res.data.summary.netGrowth) || 0,
          })
          if (res.data.summary.plans) {
            try {
              const parsed = typeof res.data.summary.plans === "string" ? JSON.parse(res.data.summary.plans) : res.data.summary.plans
              if (Array.isArray(parsed)) setPlans(parsed)
            } catch {}
          }
        }
      } else {
        toast.error(res.message || "Failed to load growth report")
        setData([])
      }
    } catch {
      toast.error("Error loading membership growth report")
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

      const res = await apiClient.downloadMembershipGrowthReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Membership Growth as ${format.toUpperCase()}`)
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
          featureLabel="Membership Growth Report"
          clubId={clubId ?? ""}
          currentTier={clubFeatureConfig?.billing_tier}
        />
      </DashboardLayout>
    )
  }

  const columns: ReportColumn<MembershipGrowthRow>[] = [
    {
      key: "memberName",
      header: "Member",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.memberName}</div>
          <div className="text-[11px] text-muted-foreground">{row.email}</div>
        </div>
      ),
      width: "w-52",
    },
    {
      key: "planName",
      header: "Membership Plan",
      accessor: "planName",
      width: "w-44",
    },
    {
      key: "start_date",
      header: "Joined Date",
      accessor: (row) => (row.joinedDate ? row.joinedDate.slice(0, 10) : "—"),
      sortable: true,
      width: "w-36",
    },
    {
      key: "renewalDate",
      header: "Renewal Date",
      accessor: (row) => (row.renewalDate ? row.renewalDate.slice(0, 10) : "N/A"),
      width: "w-36",
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      accessor: (row) => (row.expiryDate ? row.expiryDate.slice(0, 10) : "Lifelong"),
      width: "w-36",
    },
    {
      key: "status",
      header: "Current Status",
      accessor: (row) => renderStatusBadge(row.status),
      sortable: true,
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "New Members",
      value: summaryData.newMembers.toLocaleString(),
      icon: UserPlus,
      iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Renewed Members",
      value: summaryData.renewedMembers.toLocaleString(),
      icon: RefreshCw,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Expired Memberships",
      value: summaryData.expiredMemberships.toLocaleString(),
      icon: UserX,
      iconColor: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      label: "Net Growth",
      value: (summaryData.netGrowth >= 0 ? "+" : "") + summaryData.netGrowth.toLocaleString(),
      icon: TrendingUp,
      iconColor: summaryData.netGrowth >= 0
        ? "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
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
        title="Membership Growth Report"
        description="Tracks new member registrations, renewals, expired memberships, and net growth metrics over time."
        category="Lifecycle"
        actions={<ExportButton onExport={handleExport} disabled={loading || data.length === 0} />}
        filters={
          <ReportFilters
            initialFilters={filters}
            statusOptions={statusOptions}
            statusLabel="Status"
            searchPlaceholder="Search member name, email, plan..."
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
          emptyMessage="No membership growth records found for the selected criteria."
        />
      </ReportShell>
    </DashboardLayout>
  )
}
