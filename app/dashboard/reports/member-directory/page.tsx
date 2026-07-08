"use client"

import { useCallback, useEffect, useState } from "react"
import { Users, UserCheck, UserX, UserMinus, Clock } from "lucide-react"
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

// ─── Status Badge Variant Helper ──────────────────────────────────────────────

function renderStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "active":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0">Active</Badge>
    case "expired":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0">Expired</Badge>
    case "cancelled":
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0">Cancelled</Badge>
    case "pending":
    case "suspended":
      return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-0">{status}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ─── Row Interface ────────────────────────────────────────────────────────────

interface MemberDirectoryRow extends Record<string, unknown> {
  id: string
  userMembershipId: string
  memberName: string
  email: string
  phoneNumber: string
  city: string
  planName: string
  status: string
  startDate: string | null
  endDate: string | null
  registrationDate: string | null
}

interface PlanOption {
  id: string
  name: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemberDirectoryReportPage() {
  const auth = useReportAuthorization("member-directory")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MemberDirectoryRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    cancelledMembers: 0,
    pendingMembers: 0,
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

  // ── Fetch Report Data ───────────────────────────────────────────────────────

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

      if (filters.status) queryParams.status = filters.status
      if (filters.extras?.membershipPlanId && filters.extras.membershipPlanId !== "all") {
        queryParams.membershipPlanId = filters.extras.membershipPlanId
      }

      const res = await apiClient.getMemberDirectoryReport(queryParams)
      if (res.success && res.data) {
        setData(res.data.data)
        if (res.data.meta?.pagination) {
          setPagination(res.data.meta.pagination)
        }
        if (res.data.summary) {
          setSummaryData({
            totalMembers: Number(res.data.summary.totalMembers) || 0,
            activeMembers: Number(res.data.summary.activeMembers) || 0,
            expiredMembers: Number(res.data.summary.expiredMembers) || 0,
            cancelledMembers: Number(res.data.summary.cancelledMembers) || 0,
            pendingMembers: Number(res.data.summary.pendingMembers) || 0,
          })
          if (res.data.summary.plans) {
            try {
              const parsedPlans = typeof res.data.summary.plans === "string" ? JSON.parse(res.data.summary.plans) : res.data.summary.plans
              if (Array.isArray(parsedPlans)) setPlans(parsedPlans)
            } catch {
              // Ignore plan parse errors
            }
          }
        }
      } else {
        toast.error(res.message || "Failed to load member directory")
        setData([])
      }
    } catch {
      toast.error("Error loading member directory report")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clubId, selectedClubId, isSystemOwner, page, sort, filters, auth.authorized])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // ── Handlers ────────────────────────────────────────────────────────────────

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
      const queryParams: Record<string, any> = {
        format,
        ...resolveExportClubId({ clubId, selectedClubId, isSystemOwner }),
      }
      if (filters.status) queryParams.status = filters.status
      if (filters.extras?.membershipPlanId && filters.extras.membershipPlanId !== "all") {
        queryParams.membershipPlanId = filters.extras.membershipPlanId
      }

      const res = await apiClient.downloadMemberDirectoryReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Member Directory as ${format.toUpperCase()}`)
      }
    } catch {
      toast.error("Export failed")
    }
  }

  // ── Access & Feature Guards ─────────────────────────────────────────────────

  if (!auth.authorized) {
    return (
      <DashboardLayout>
        <AccessDeniedPage reason={auth.reason} message={auth.message} />
      </DashboardLayout>
    )
  }

  // ── Column Definitions ──────────────────────────────────────────────────────

  const columns: ReportColumn<MemberDirectoryRow>[] = [
    {
      key: "userMembershipId",
      header: "Member ID",
      accessor: "userMembershipId",
      sortable: true,
      width: "w-36",
    },
    {
      key: "user.first_name",
      header: "Member Name",
      accessor: "memberName",
      sortable: true,
      width: "w-48",
    },
    {
      key: "user.email",
      header: "Email",
      accessor: "email",
      sortable: true,
      width: "w-56",
    },
    {
      key: "phoneNumber",
      header: "Phone Number",
      accessor: "phoneNumber",
      width: "w-36",
    },
    {
      key: "city",
      header: "City",
      accessor: "city",
      width: "w-32",
    },
    {
      key: "planName",
      header: "Plan",
      accessor: "planName",
      width: "w-36",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => renderStatusBadge(row.status),
      sortable: true,
      width: "w-28",
    },
    {
      key: "start_date",
      header: "Start Date",
      accessor: (row) => (row.startDate ? row.startDate.slice(0, 10) : "—"),
      sortable: true,
      width: "w-32",
    },
    {
      key: "endDate",
      header: "End Date",
      accessor: (row) => (row.endDate ? row.endDate.slice(0, 10) : "Lifelong"),
      width: "w-32",
    },
  ]

  // ── Summary Cards Config ────────────────────────────────────────────────────

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Members",
      value: summaryData.totalMembers.toLocaleString(),
    },
    {
      label: "Active Members",
      value: summaryData.activeMembers.toLocaleString(),
    },
    {
      label: "Expired Members",
      value: summaryData.expiredMembers.toLocaleString(),
    },
    {
      label: "Cancelled Members",
      value: summaryData.cancelledMembers.toLocaleString(),
    },
  ]

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
    { value: "pending", label: "Pending" },
    { value: "suspended", label: "Suspended" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Member Directory"
        description="Comprehensive directory of club members, active plans, membership IDs, and statuses."
        category="Lifecycle"
        actions={
          <ExportButton
            onExport={handleExport}
            disabled={loading || data.length === 0}
          />
        }
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
            searchPlaceholder="Search by name, email, phone, or member ID..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {/* Custom Extra Filter: Membership Plan Dropdown */}
            {plans.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Membership Plan</Label>
                <Select
                  value={filters.extras?.membershipPlanId || "all"}
                  onValueChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      extras: { ...prev.extras, membershipPlanId: val },
                    }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
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
          emptyMessage="No members match the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
