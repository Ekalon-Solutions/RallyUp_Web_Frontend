"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe, Palette, Bell, BookOpen, MapPin, Zap, CircleHelp, ShieldCheck, MessageSquare } from "lucide-react"
import { WebsiteSetupTab } from "@/components/admin/settings/website-setup-tab"
import { DesignSettingsTab } from "@/components/admin/settings/design-settings-tab"
import { NotificationTemplatesPanel } from "@/components/admin/notification-templates/notification-templates-panel"
import { HelpSectionTab } from "@/components/admin/settings/help-section-tab"
import { GetStartedTab } from "@/components/admin/settings/get-started-tab"
import { ClubAddressTab } from "@/components/admin/settings/club-address-tab"
import { FeatureLimitsTab } from "@/components/admin/settings/feature-limits-tab"
import { RefundPolicySettingsTab } from "@/components/admin/settings/refund-policy-settings-tab"
import { WhatsAppMarketingTab } from "@/components/admin/settings/whatsapp-marketing-tab"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { useAdminModulePermission } from "@/hooks/useAdminModulePermission"

const TAB_TRIGGER_CLASS =
  "flex items-center gap-2 shrink-0 flex-none whitespace-nowrap min-w-max"

export default function AdminSettingsClient() {
  const clubId = useRequiredClubId()
  const [activeTab, setActiveTab] = useState("website")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isEnabled: isClubFeatureEnabled } = useClubFeatures(clubId ?? null)
  const refundsAccess = useAdminModulePermission("refunds")
  const showRefundTab = isClubFeatureEnabled("refunds") && refundsAccess.canView
  const showMarketingTab = isClubFeatureEnabled("wa_marketing")

  const normalizeTab = (raw: string | null) => {
    if (!raw) return null

    if (raw === "app-settings") return "app"
    if (raw === "get-started") return "guide"

    const allowedTabs = new Set(["website", "design", "app", "address", "limits", "help", "guide", "refund", "marketing"])
    if (!allowedTabs.has(raw)) return null
    if (raw === "refund" && !showRefundTab) return null
    if (raw === "marketing" && !showMarketingTab) return null
    return raw
  }

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get("tab"))
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }, [activeTab, searchParams, showRefundTab, showMarketingTab])

  useEffect(() => {
    if (activeTab === "refund" && !showRefundTab) setActiveTab("website")
    if (activeTab === "marketing" && !showMarketingTab) setActiveTab("website")
  }, [activeTab, showRefundTab, showMarketingTab])

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
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
            className="space-y-4 min-w-0"
          >
            <TabsList className="flex w-full max-w-full sm:w-full min-w-0 h-auto flex-nowrap justify-start gap-1 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:thin]">
              <TabsTrigger value="website" className={TAB_TRIGGER_CLASS}>
                <Globe className="h-4 w-4 shrink-0" />
                Website
              </TabsTrigger>
              <TabsTrigger value="design" className={TAB_TRIGGER_CLASS}>
                <Palette className="h-4 w-4 shrink-0" />
                Design
              </TabsTrigger>
              <TabsTrigger value="app" className={TAB_TRIGGER_CLASS}>
                <Bell className="h-4 w-4 shrink-0" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="address" className={TAB_TRIGGER_CLASS}>
                <MapPin className="h-4 w-4 shrink-0" />
                Club Address
              </TabsTrigger>
              <TabsTrigger value="limits" className={TAB_TRIGGER_CLASS}>
                <Zap className="h-4 w-4 shrink-0" />
                Feature Limits
              </TabsTrigger>
              <TabsTrigger value="help" className={TAB_TRIGGER_CLASS}>
                <CircleHelp className="h-4 w-4 shrink-0" />
                Help
              </TabsTrigger>
              <TabsTrigger value="guide" className={TAB_TRIGGER_CLASS}>
                <BookOpen className="h-4 w-4 shrink-0" />
                Get Started
              </TabsTrigger>
              {showRefundTab && (
                <TabsTrigger value="refund" className={TAB_TRIGGER_CLASS}>
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Refund Policy
                </TabsTrigger>
              )}
              {showMarketingTab && (
                <TabsTrigger value="marketing" className={TAB_TRIGGER_CLASS}>
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  WhatsApp Marketing
                </TabsTrigger>
              )}
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

            {showRefundTab && (
              <TabsContent value="refund" className="space-y-4">
                <RefundPolicySettingsTab key={clubId ?? "no-club"} />
              </TabsContent>
            )}

            {showMarketingTab && (
              <TabsContent value="marketing" className="space-y-4">
                <WhatsAppMarketingTab key={clubId ?? "no-club"} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
