"use client"

import { useCallback, useEffect, useState } from "react"
import { Sliders, Shield, Zap, User } from "lucide-react"
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

function renderValueBadge(val: string) {
  let v = (val || "").toLowerCase()
  try {
    const parsed = JSON.parse(v)
    if (typeof parsed === "object" && parsed !== null) {
      if ("enabled" in parsed) v = String(parsed.enabled)
      else if ("state" in parsed) v = parsed.state
    }
  } catch {}
  if (v === "true" || v === "enabled" || v === "active") {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 font-medium">Enabled</Badge>
  }
  if (v === "false" || v === "disabled" || v === "inactive") {
    return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-0 font-medium">Disabled</Badge>
  }
  return <Badge variant="outline">{val.charAt(0).toUpperCase() + val.slice(1)}</Badge>
}

interface FeatureSelectorRow extends Record<string, unknown> {
  id: string
  timestamp: string
  featureKey: string
  oldValue: string
  newValue: string
  summary: string
  actorName: string
  actorType: string
  reasonCode: string
}

interface FeatureOption {
  value: string
  label: string
}

export default function FeatureSelectorReportPage() {
  const auth = useReportAuthorization("feature-selector")
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FeatureSelectorRow[]>([])
  const [pagination, setPagination] = useState<ReportPaginationMeta | undefined>()
  const [summaryData, setSummaryData] = useState({
    totalChanges: 0,
    tierUpdates: 0,
    addonActivations: 0,
    uniqueActors: 0,
  })
  const [featureOptions, setFeatureOptions] = useState<FeatureOption[]>([])

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    status: undefined,
    extras: { featureKey: "all" },
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

      if (filters.status && filters.status !== "all") queryParams.actorType = filters.status
      if (filters.extras?.featureKey && filters.extras.featureKey !== "all") {
        queryParams.featureKey = filters.extras.featureKey
      }

      const res = await apiClient.getFeatureSelectorReport(queryParams)
      if (res.success && res.data) {
        // Mandatory Pattern v1.2 data extraction
        const rawRows = Array.isArray(res.data.data) ? res.data.data : []
        setData(rawRows)

        if (res.data.meta?.pagination) setPagination(res.data.meta.pagination)
        if (res.data.summary) {
          setSummaryData({
            totalChanges: Number(res.data.summary.totalChanges) || 0,
            tierUpdates: Number(res.data.summary.tierUpdates) || 0,
            addonActivations: Number(res.data.summary.addonActivations) || 0,
            uniqueActors: Number(res.data.summary.uniqueActors) || 0,
          })
          if (res.data.summary.featureOptions) {
            try {
              const parsed = typeof res.data.summary.featureOptions === "string"
                ? JSON.parse(res.data.summary.featureOptions)
                : res.data.summary.featureOptions
              if (Array.isArray(parsed)) setFeatureOptions(parsed)
            } catch {}
          }
        }
      } else {
        toast.error(res.message || "Failed to load Feature Selector report")
        setData([])
      }
    } catch {
      toast.error("Error loading Feature Selector report")
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
    setFilters({ extras: { featureKey: "all" } })
    setPage(1)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!shouldFetchReport({ authorized: auth.authorized, clubId, isSystemOwner })) return
    try {
      const queryParams: Record<string, any> = { clubId, format }
      if (filters.status && filters.status !== "all") queryParams.actorType = filters.status
      if (filters.extras?.featureKey && filters.extras.featureKey !== "all") {
        queryParams.featureKey = filters.extras.featureKey
      }

      const res = await apiClient.downloadFeatureSelectorReport(queryParams)
      if (!res.success) {
        toast.error(res.error || "Export failed")
      } else {
        toast.success(`Exported Feature Selector Audit as ${format.toUpperCase()}`)
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

  const columns: ReportColumn<FeatureSelectorRow>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      accessor: (row) => (
        <span className="font-mono text-xs">
          {row.timestamp ? row.timestamp.replace("T", " ").slice(0, 19) : "—"}
        </span>
      ),
      sortable: true,
      width: "w-44",
    },
    {
      key: "featureKey",
      header: "Feature Key",
      accessor: (row) => <span className="font-mono font-medium text-xs text-purple-600 dark:text-purple-400">{row.featureKey}</span>,
      sortable: true,
      width: "w-44",
    },
    {
      key: "oldValue",
      header: "Change",
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          {renderValueBadge(row.oldValue)}
          <span>→</span>
          {renderValueBadge(row.newValue)}
        </div>
      ),
      width: "w-48",
    },
    {
      key: "summary",
      header: "Summary",
      accessor: (row) => <span className="text-xs truncate max-w-full block" title={row.summary}>{row.summary}</span>,
      width: "w-56",
    },
    {
      key: "actorName",
      header: "Changed By",
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs">{row.actorName}</div>
          <div className="text-[10px] text-muted-foreground uppercase">{row.actorType}</div>
        </div>
      ),
      sortable: true,
      width: "w-40",
    },
    {
      key: "reasonCode",
      header: "Reason Code",
      accessor: (row) => <span className="text-xs text-muted-foreground">{row.reasonCode}</span>,
      width: "w-32",
    },
  ]

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Configuration Changes",
      value: summaryData.totalChanges.toLocaleString(),
    },
    {
      label: "Tier Updates",
      value: summaryData.tierUpdates.toLocaleString(),
    },
    {
      label: "Add-on Activations",
      value: summaryData.addonActivations.toLocaleString(),
    },
    {
      label: "Unique Change Actors",
      value: summaryData.uniqueActors.toLocaleString(),
    },
  ]

  const actorTypeOptions = [
    { value: "admin", label: "Admin" },
    { value: "system_owner", label: "System Owner" },
  ]

  return (
    <DashboardLayout>
      <ReportShell
        title="Feature Selector Audit Report"
        description="Immutable audit trail of club tier upgrades, add-on feature activations, and feature configuration adjustments."
        category="Governance"
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
            statusOptions={actorTypeOptions}
            statusLabel="Actor Type"
            searchPlaceholder="Search feature key, summary, actor name, reason..."
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={loading}
          >
            {featureOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Feature</Label>
                <Select
                  value={filters.extras?.featureKey || "all"}
                  onValueChange={(val) => setFilters((prev) => ({ ...prev, extras: { ...prev.extras, featureKey: val } }))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Features" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Features</SelectItem>
                    {featureOptions.map((fk) => (
                      <SelectItem key={fk.value} value={fk.value}>{fk.label}</SelectItem>
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
          emptyMessage="No feature configuration audit records found for the selected criteria."
          showClubColumn={isSystemOwner && !selectedClubId}
        />
      </ReportShell>
    </DashboardLayout>
  )
}
