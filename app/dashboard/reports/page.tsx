"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { getEffectiveAdminRole } from "@/lib/adminPermissions"
import { authorizeReportAccess } from "@/hooks/useReportAuthorization"
import { resolveExportClubId } from "@/lib/reportHelpers"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SystemOwnerClubFilter } from "@/components/reports/SystemOwnerClubFilter"
import { EmbeddedReportContext } from "@/components/reports/ReportShell"
import { REPORT_TABS, type TabId } from "@/components/reports/hub/report-tabs"
import { TabOverview, overviewStartDate } from "@/components/reports/hub/tab-overview"
import { cn } from "@/lib/utils"

type Download = (p: Record<string, any>) => Promise<{ success: boolean; error?: string }>

const DOWNLOADERS: Record<string, Download> = {
  "total-order-summary": (p) => apiClient.downloadTotalOrderSummaryReport(p),
  "merchandise-refunds": (p) => apiClient.downloadMerchandiseRefundsReport(p),
  "best-seller": (p) => apiClient.downloadBestSellerReport(p),
  inventory: (p) => apiClient.downloadInventoryReport(p),
  "external-tickets": (p) => apiClient.downloadExternalTicketReport(p),
  "refund-log": (p) => apiClient.downloadRefundLogReport(p),
  "event-ticket-sales": (p) => apiClient.downloadEventTicketSalesReport(p),
  "event-ticket-refunds": (p) => apiClient.downloadEventTicketRefundsReport(p),
  "event-passes-scanned": (p) => apiClient.downloadEventPassesScannedReport(p),
  "member-directory": (p) => apiClient.downloadMemberDirectoryReport(p),
  "membership-growth": (p) => apiClient.downloadMembershipGrowthReport(p),
  "membership-purchases": (p) => apiClient.downloadMembershipPurchaseReport(p),
  "membership-renewals": (p) => apiClient.downloadMembershipRenewalReport(p),
  "pickup-delivery": (p) => apiClient.downloadPickupDeliveryReport(p),
  rto: (p) => apiClient.downloadRTOReport(p),
  "reward-points-granted": (p) => apiClient.downloadRewardPointsGrantedReport(p),
  "reward-points-redemption": (p) => apiClient.downloadRewardPointsRedemptionReport(p),
  "admin-audit": (p) => apiClient.downloadAdminAuditLogReport(p),
  "elevate-demote": (p) => apiClient.downloadElevateDemoteLogReport(p),
  "feature-selector": (p) => apiClient.downloadFeatureSelectorReport(p),
  "super-admin-audit-log": (p) => apiClient.downloadSuperAdminAuditLogReport(p),
  "subscription-billing": (p) => apiClient.downloadSubscriptionBillingReport(p),
  "whatsapp-billing": (p) => apiClient.downloadWhatsAppBillingReport(p),
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

export default function ReportsHubPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()
  const activeClubId = isSystemOwner ? selectedClubId : clubId
  const { config: clubFeatureConfig } = useClubFeatures(activeClubId ?? null)

  const effectiveRole = getEffectiveAdminRole(user, activeClubId)
  const canViewReportsHub = ["admin", "super_admin", "system_owner"].includes(effectiveRole)

  const accessible = useMemo(
    () => new Set(REPORT_TABS.flatMap((t) => t.reports).filter((r) => authorizeReportAccess(r.id, user, activeClubId, clubFeatureConfig).authorized).map((r) => r.id)),
    [user, activeClubId, clubFeatureConfig],
  )
  const tabs = useMemo(
    () => REPORT_TABS.map((t) => ({ ...t, reports: t.reports.filter((r) => accessible.has(r.id)) })).filter((t) => t.reports.length > 0),
    [accessible],
  )

  const [tabId, setTabId] = useState<TabId>("revenue")
  const [reportByTab, setReportByTab] = useState<Partial<Record<TabId, string>>>({})
  const [exporting, setExporting] = useState(false)

  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0]
  const report = tab?.reports.find((r) => r.id === reportByTab[tab.id]) ?? tab?.reports[0]
  const scope = useMemo(() => resolveExportClubId({ clubId, selectedClubId, isSystemOwner }), [clubId, selectedClubId, isSystemOwner])

  if (!canViewReportsHub || !tab || !report) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{canViewReportsHub ? "No reports available" : "Access Denied"}</h2>
            <p className="text-muted-foreground">
              {canViewReportsHub ? "No reports are available with your current permissions." : "You don't have permission to view reports."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const exportAll = async () => {
    setExporting(true)
    let failed = 0
    for (const r of tab.reports) {
      const res = await DOWNLOADERS[r.id]?.({ format: "xlsx", ...scope }).catch(() => ({ success: false }))
      if (!res?.success) failed++
    }
    setExporting(false)
    if (failed) toast.error(`${failed} of ${tab.reports.length} exports failed`)
    else toast.success(`Exported ${tab.reports.length} ${tab.label.toLowerCase()} report${tab.reports.length > 1 ? "s" : ""}`)
  }

  const pills = (
    // One swipeable row on phones; wraps from sm up.
    <div className="-mx-3 px-3 flex gap-2 overflow-x-auto sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tab.reports.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setReportByTab((m) => ({ ...m, [tab.id]: r.id }))}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            r.id === report.id
              ? "border-[var(--ra-ink)] bg-[var(--ra-ink)] text-[var(--ra-bg)]"
              : "border-[var(--ra-line)] text-[var(--ra-mid)] hover:border-[var(--ra-mid)] hover:text-[var(--ra-ink)]",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  const ActiveReport = report.Component

  return (
    <DashboardLayout>
      <div className="ra-scope relative space-y-6 text-[var(--ra-ink)]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-xl min-[400px]:text-2xl sm:text-3xl font-black tracking-tight break-words">Reporting &amp; Analytics — {tab.title}</h1>
            <p className="mt-2 text-sm text-[var(--ra-mid)]">{tab.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full md:w-auto">
            {isSystemOwner && <SystemOwnerClubFilter selectedClubId={selectedClubId} onChange={setSelectedClubId} />}
            <button
              type="button"
              onClick={exportAll}
              disabled={exporting}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-md border border-[var(--ra-line)] px-3.5 py-2 text-xs font-semibold hover:border-[var(--ra-mid)] disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export all {tab.label.toLowerCase()} reports (Excel)
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 border-b border-[var(--ra-line)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-5 sm:gap-6 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabId(t.id)}
                className={cn(
                  "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
                  t.id === tab.id ? "border-[var(--ra-accent)] text-[var(--ra-ink)]" : "border-transparent text-[var(--ra-mid)] hover:text-[var(--ra-ink)]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--ra-mid)]">
          Overview covers {fmtDate(overviewStartDate())} – {fmtDate(new Date().toISOString())} · tables below accept their own filters
        </p>

        {/* Overview: KPIs + charts, with the shield watermark behind */}
        <div className="relative">
          <Shield
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute -top-10 right-0 hidden lg:block h-72 w-72 text-[var(--ra-accent)] opacity-[0.12] fill-[var(--ra-accent)]/10"
          />
          <TabOverview tab={tab.id} accessible={accessible} scope={scope} />
        </div>

        {/* Sub-report: the existing report page, laid out inline */}
        <EmbeddedReportContext.Provider value={{ pills, showSummary: tab.showSummary }}>
          <ActiveReport key={report.id} />
        </EmbeddedReportContext.Provider>
      </div>
    </DashboardLayout>
  )
}
