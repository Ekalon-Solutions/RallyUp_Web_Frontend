"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CouponsTab } from "@/components/tabs/coupons-tab"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

export default function AdminCouponsPage() {
  const clubId = useRequiredClubId()

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Coupons</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create and manage discount coupons for events and merchandise
            </p>
          </div>
          {clubId ? <CouponsTab clubId={clubId} /> : (
            <p className="text-muted-foreground">Please select a club to manage coupons.</p>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
