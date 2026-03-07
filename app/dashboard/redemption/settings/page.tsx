"use client"

import { DashboardLayout } from '@/components/dashboard-layout'
import RedemptionSettingsTab from '@/components/admin/settings/redemption-settings-tab'

export default function RedemptionSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Redemption & Expiry Settings</h1>
        <RedemptionSettingsTab />
      </div>
    </DashboardLayout>
  )
}
