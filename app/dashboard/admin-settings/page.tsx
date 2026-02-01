"use client"

import React, { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe, List, Palette, Bell, HelpCircle, BookOpen } from "lucide-react"
import { WebsiteSetupTab } from "@/components/admin/settings/website-setup-tab"
import { DirectoryTab } from "@/components/admin/settings/directory-tab"
import { DesignSettingsTab } from "@/components/admin/settings/design-settings-tab"
import { AppSettingsTab } from "@/components/admin/settings/app-settings-tab"
import { HelpSectionTab } from "@/components/admin/settings/help-section-tab"
import { GetStartedTab } from "@/components/admin/settings/get-started-tab"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("website")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const normalizeTab = (raw: string | null) => {
    if (!raw) return null
    
    if (raw === "app-settings") return "app"
    if (raw === "get-started") return "guide"

    const allowedTabs = new Set(["website", "directory", "design", "app", "help", "guide"])
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
              Configure your club's website, design, and functionality
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
            <TabsList className="flex overflow-auto justify-start sm:justify-between w-full grid-cols-6">
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Directory
              </TabsTrigger>
              <TabsTrigger value="design" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Design
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                App Settings
              </TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Get Started
              </TabsTrigger>
            </TabsList>

            <TabsContent value="website" className="space-y-4">
              <WebsiteSetupTab />
            </TabsContent>

            <TabsContent value="directory" className="space-y-4">
              <DirectoryTab />
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <DesignSettingsTab />
            </TabsContent>

            <TabsContent value="app" className="space-y-4">
              <AppSettingsTab />
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <HelpSectionTab />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <GetStartedTab />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
