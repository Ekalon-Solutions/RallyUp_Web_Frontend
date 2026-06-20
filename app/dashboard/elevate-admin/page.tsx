"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { ElevateMemberAdminPanel } from "@/components/admin/elevate-member-admin-panel"
import { ClubAdminRoster } from "@/components/admin/club-admin-roster"
import { AdminPermissionMatrix } from "@/components/admin/admin-permission-matrix"
import { VendorRoster } from "@/components/admin/vendor-roster"
import { VendorAssignmentPanel } from "@/components/admin/vendor-assignment-panel"
import { AdminActivityLogDialog } from "@/components/admin/admin-activity-log-dialog"
import { usePrimaryClubOwner } from "@/hooks/usePrimaryClubOwner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Shield,
  UserPlus,
  Users,
  SlidersHorizontal,
  ScanLine,
  History,
} from "lucide-react"

const TABS = [
  { value: "elevate", label: "Elevate", icon: UserPlus },
  { value: "team", label: "Team", icon: Users },
  { value: "permissions", label: "Permissions", icon: SlidersHorizontal },
  { value: "vendors", label: "Vendors", icon: ScanLine },
] as const

export default function ElevateAdminPage() {
  const router = useRouter()
  const { isPrimaryOwner, loading, clubId } = usePrimaryClubOwner()
  const [activeTab, setActiveTab] = useState<string>("elevate")
  const [activityLogOpen, setActivityLogOpen] = useState(false)
  const [vendorRefresh, setVendorRefresh] = useState(0)

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
          <div className="space-y-8">
            {/* Page header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Team &amp; Access
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Elevate members into admin roles, manage your team, fine-tune permissions, and run
                  match-day vendor operations — all in one place.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActivityLogOpen(true)}
                className="shrink-0"
              >
                <History className="h-4 w-4 mr-2" />
                Activity Log
              </Button>
            </div>

            <AdminActivityLogDialog
              clubId={clubId}
              open={activityLogOpen}
              onOpenChange={setActivityLogOpen}
            />

            {/* Primary navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:max-w-xl h-auto">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger key={value} value={value} className="gap-1.5 py-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="elevate" className="mt-6">
                <ElevateMemberAdminPanel />
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <ClubAdminRoster />
              </TabsContent>

              <TabsContent value="permissions" className="mt-6">
                <AdminPermissionMatrix />
              </TabsContent>

              <TabsContent value="vendors" className="mt-6 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ScanLine className="h-7 w-7 text-primary" />
                    Match-day vendors
                  </h2>
                  <p className="text-muted-foreground max-w-2xl">
                    Assign scan-only crew to specific events and gates, and audit exactly what the
                    vendor role can access. To add a new vendor, use the{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => setActiveTab("elevate")}
                    >
                      Elevate
                    </button>{" "}
                    tab and pick the Vendor role.
                  </p>
                </div>
                <VendorRoster onChanged={() => setVendorRefresh((n) => n + 1)} />
                <VendorAssignmentPanel refreshSignal={vendorRefresh} />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
