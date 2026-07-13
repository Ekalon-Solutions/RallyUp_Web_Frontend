"use client"

import { useCallback, useEffect, useState } from "react"
import { UserPlus, RefreshCw, UserX, TrendingUp } from "lucide-react"
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

function renderLifecycleStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "new":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">New</Badge>
    case "renewed":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Renewed</Badge>
    case "expired":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Expired</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

interface MembershipGrowthRow extends Record<string, unknown> {
  id: string
  userMembershipId: string
  memberName: string
  email: string
  phoneNumber: string
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
  const auth = useReportAuthorization("membership-growth")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

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

  if (!auth.authorized) {
    return (
      <DashboardLayout>
        <AccessDeniedPage reason={auth.reason} message={auth.message} />
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
      accessor: (row) => renderLifecycleStatusBadge(row.status),
      sortable: true,
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "New Members",
      value: summaryData.newMembers.toLocaleString(),
    },
    {
      label: "Renewed Members",
      value: summaryData.renewedMembers.toLocaleString(),
    },
    {
      label: "Expired Memberships",
      value: summaryData.expiredMemberships.toLocaleString(),
    },
    {
      label: "Net Growth",
      value: (summaryData.netGrowth >= 0 ? "+" : "") + summaryData.netGrowth.toLocaleString(),
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
          emptyMessage="No membership growth records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
