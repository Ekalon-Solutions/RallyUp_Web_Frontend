"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LockedFeaturePage } from "@/components/feature-gate"
import { LogisticsReportPanel } from "@/components/admin/logistics-report-panel"

export default function LogisticsReportPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)

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
          featureLabel="Logistics Report"
          clubId={clubId ?? ""}
          currentTier={clubFeatureConfig?.billing_tier}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Logistics Report</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Shipping costs, delivery lead times, and RTO performance for the club.
          </p>
        </div>
        {clubId && <LogisticsReportPanel clubId={clubId} />}
      </div>
    </DashboardLayout>
  )
}
