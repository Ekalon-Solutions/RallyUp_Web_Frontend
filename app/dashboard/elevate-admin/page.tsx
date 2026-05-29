"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { ElevateMemberAdminPanel } from "@/components/admin/elevate-member-admin-panel"
import { usePrimaryClubOwner } from "@/hooks/usePrimaryClubOwner"
import { Loader2 } from "lucide-react"

export default function ElevateAdminPage() {
  const router = useRouter()
  const { isPrimaryOwner, loading } = usePrimaryClubOwner()

  useEffect(() => {
    if (!loading && !isPrimaryOwner) {
      router.replace("/dashboard")
    }
  }, [loading, isPrimaryOwner, router])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isPrimaryOwner ? (
          <ElevateMemberAdminPanel />
        ) : null}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
