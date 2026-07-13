"use client"

import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccessDeniedPage, ReportShell } from "@/components/reports"

export default function AdsConfigReportPage() {
  const auth = useReportAuthorization("ads-config")

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
        title="Ads Configuration Report"
        description="Configuration overview for ad placements, sponsor settings, and monetization controls."
        category="Ads"
      >
        <div className="p-8 text-center text-sm text-muted-foreground">
          No ad configuration records are available.
        </div>
      </ReportShell>
    </DashboardLayout>
  )
}
