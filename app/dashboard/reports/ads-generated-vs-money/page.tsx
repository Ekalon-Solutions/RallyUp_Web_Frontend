"use client"

import { useReportAuthorization } from "@/hooks/useReportAuthorization"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccessDeniedPage, ReportShell } from "@/components/reports"

export default function AdsGeneratedVsMoneyReportPage() {
  const auth = useReportAuthorization("ads-generated-vs-money")

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
        title="Ads Generated vs Money Earned"
        description="ROI analysis of local sponsor and network ads with impression, click, and revenue tracking."
        category="Ads"
      >
        <div className="p-8 text-center text-sm text-muted-foreground">
          No ad revenue records are available.
        </div>
      </ReportShell>
    </DashboardLayout>
  )
}
