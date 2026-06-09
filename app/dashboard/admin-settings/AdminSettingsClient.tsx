"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe, Palette, Bell, BookOpen, MapPin, Zap, CircleHelp, ShieldCheck } from "lucide-react"
import { WebsiteSetupTab } from "@/components/admin/settings/website-setup-tab"
import { DesignSettingsTab } from "@/components/admin/settings/design-settings-tab"
import { NotificationTemplatesPanel } from "@/components/admin/notification-templates/notification-templates-panel"
import { HelpSectionTab } from "@/components/admin/settings/help-section-tab"
import { GetStartedTab } from "@/components/admin/settings/get-started-tab"
import { ClubAddressTab } from "@/components/admin/settings/club-address-tab"
import { FeatureLimitsTab } from "@/components/admin/settings/feature-limits-tab"
import { RefundPolicySettingsTab } from "@/components/admin/settings/refund-policy-settings-tab"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

export default function AdminSettingsClient() {
  const clubId = useRequiredClubId()
  const [activeTab, setActiveTab] = useState("website")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const normalizeTab = (raw: string | null) => {
    if (!raw) return null

    if (raw === "app-settings") return "app"
    if (raw === "get-started") return "guide"

    const allowedTabs = new Set(["website", "design", "app", "address", "limits", "help", "guide", "refund"])
    return allowedTabs.has(raw) ? raw : null
  }

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get("tab"))
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }, [activeTab, searchParams])

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Admin Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your club&apos;s website, design, and functionality
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(nextTab) => {
              setActiveTab(nextTab)

              const params = new URLSearchParams(searchParams.toString())
              params.set("tab", nextTab)
              router.replace(`${pathname}?${params.toString()}`)
            }}
            className="space-y-4"
          >
            <TabsList className="flex overflow-auto justify-start sm:justify-between w-full">
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </TabsTrigger>
              <TabsTrigger value="design" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Design
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Club Address
              </TabsTrigger>
              <TabsTrigger value="limits" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Feature Limits
              </TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4" />
                Help
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Get Started
              </TabsTrigger>
              <TabsTrigger value="refund" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Refund Policy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="website" className="space-y-4">
              <WebsiteSetupTab key={clubId ?? "no-club"} />
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <DesignSettingsTab key={clubId ?? "no-club"} />
            </TabsContent>

            <TabsContent value="app" className="space-y-4">
              <NotificationTemplatesPanel key={clubId ?? "no-club"} />
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <ClubAddressTab key={clubId ?? "no-club"} />
            </TabsContent>

            <TabsContent value="limits" className="space-y-4">
              <FeatureLimitsTab key={clubId ?? "no-club"} />
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <HelpSectionTab key={clubId ?? "no-club"} />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <GetStartedTab />
            </TabsContent>

            <TabsContent value="refund" className="space-y-4">
              <RefundPolicySettingsTab key={clubId ?? "no-club"} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
