"use client"

import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccessDeniedPage, ReportShell } from "@/components/reports"

export default function AdsPerformanceReportPage() {
  const auth = useReportAuthorization("ads-performance")

  if (!auth.authorized) {
    return (
      <DashboardLayout>
        <AccessDeniedPage reason={auth.reason} message={auth.message} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ReportShell
        title="Ad Performance Report"
        description="Impressions, clicks, CTR, conversions, and ROAS metrics for club-specific advertising campaigns."
        category="Ads"
      >
        <div className="p-8 text-center text-sm text-muted-foreground">
          No ad performance records are available.
        </div>
      </ReportShell>
    </DashboardLayout>
  )
}
