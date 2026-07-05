"use client"

import { useCallback, useEffect, useState } from "react"
import { Clock, RefreshCw, AlertTriangle, TrendingUp } from "lucide-react"
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

function renderRenewalStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  if (s.includes("expiring soon")) {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 font-medium">Expiring Soon</Badge>
  }
  if (s.includes("expired")) {
    return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Expired</Badge>
  }
  if (s.includes("auto-renew")) {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 font-medium">Auto-Renew</Badge>
  }
  return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">{status}</Badge>
}

interface MembershipExpiryRow extends Record<string, unknown> {
  id: string
  memberName: string
  email: string
  planName: string
  startDate: string | null
  expiryDate: string | null
  daysRemaining: number | string
  renewalStatus: string
}

interface PlanOption {
  id: string
  name: string
}

export default function MembershipExpiryReportPage() {
  const auth = useReportAuthorization("membership-expiry")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MembershipExpiryRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    expiringSoon: 0,
    renewed: 0,
    expired: 0,
    renewalRate: 0,
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
    field: "end_date",
    direction: "asc",
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

      const res = await apiClient.getMembershipRenewalReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            expiringSoon: Number(res.data.summary.expiringSoon) || 0,
            renewed: Number(res.data.summary.renewed) || 0,
            expired: Number(res.data.summary.expired) || 0,
            renewalRate: Number(res.data.summary.renewalRate) || 0,
          })
          if (res.data.summary.plans) {
            try {
              const parsed = typeof res.data.summary.plans === "string" ? JSON.parse(res.data.summary.plans) : res.data.summary.plans
              if (Array.isArray(parsed)) setPlans(parsed)
            } catch {}
          }
        }
      } else {
        toast.error(res.message || "Failed to load membership expiry report")
        setData([])
      }
    } catch {
      toast.error("Error loading membership expiry report")
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
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.extras?.membershipPlanId && filters.extras.membershipPlanId !== "all") {
        queryParams.membershipPlanId = filters.extras.membershipPlanId
      }

      const res = await apiClient.downloadMembershipRenewalReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Membership Expiry as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<MembershipExpiryRow>[] = [
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
      header: "Start Date",
      accessor: (row) => (row.startDate ? row.startDate.slice(0, 10) : "—"),
      sortable: true,
      width: "w-36",
    },
    {
      key: "end_date",
      header: "Expiry Date",
      accessor: (row) => (row.expiryDate ? row.expiryDate.slice(0, 10) : "Lifelong"),
      sortable: true,
      width: "w-36",
    },
    {
      key: "daysRemaining",
      header: "Days Remaining",
      accessor: (row) => (
        <span
          className={
            typeof row.daysRemaining === "number" && row.daysRemaining <= 30
              ? "font-mono font-semibold text-amber-600 dark:text-amber-400"
              : "font-mono"
          }
        >
          {typeof row.daysRemaining === "number" ? `${row.daysRemaining} days` : row.daysRemaining}
        </span>
      ),
      align: "center",
      width: "w-36",
    },
    {
      key: "renewalStatus",
      header: "Status",
      accessor: (row) => renderRenewalStatusBadge(row.renewalStatus),
      width: "w-40",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Expiring Soon (30d)",
      value: summaryData.expiringSoon.toLocaleString(),
    },
    {
      label: "Renewed Members",
      value: summaryData.renewed.toLocaleString(),
    },
    {
      label: "Expired Memberships",
      value: summaryData.expired.toLocaleString(),
    },
    {
      label: "Renewal Rate",
      value: `${summaryData.renewalRate.toFixed(1)}%`,
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
        title="Membership Expiry Report"
        description="Tracks upcoming membership expirations, days remaining, renewal rates, and churn risk levels."
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
          emptyMessage="No membership expiry records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
