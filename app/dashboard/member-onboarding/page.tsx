"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import MemberOnboardingDashboard from "@/components/member-onboarding-dashboard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function MemberOnboardingPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">Please log in to access your onboarding experience.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <MemberOnboardingDashboard 
          userId={user._id} 
          userRole={user.role as 'member' | 'admin' | 'system_owner'} 
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
