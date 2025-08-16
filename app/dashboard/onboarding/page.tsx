"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UserPlus, 
  Users, 
  Target, 
  BarChart3, 
  Plus,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import OnboardingModal from "@/components/modals/onboarding-modal"
import PromotionalContentModal from "@/components/modals/promotional-content-modal"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function OnboardingDashboard() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [showPromotionalModal, setShowPromotionalModal] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Onboarding & Engagement</h1>
          <p className="text-muted-foreground">
            Manage onboarding flows and promotional campaigns to grow your community
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowOnboardingModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Onboarding Flow
          </Button>
          <Button variant="outline" onClick={() => setShowPromotionalModal(true)}>
            <Target className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Onboarding Completion</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  3 scheduled for next week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5%</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Onboarding Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Create and manage onboarding flows to help new members get started quickly.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowOnboardingModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Flow
                  </Button>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Flows
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Promotional Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Launch campaigns to engage existing members and promote community activities.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowPromotionalModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New member completed onboarding</p>
                    <p className="text-sm text-muted-foreground">Sarah Johnson finished the welcome flow</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Promotional campaign launched</p>
                    <p className="text-sm text-muted-foreground">"Summer Community Challenge" is now active</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Onboarding flow updated</p>
                    <p className="text-sm text-muted-foreground">"New Member Welcome" flow modified</p>
                  </div>
                  <span className="text-sm text-muted-foreground">3 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Onboarding Flows</CardTitle>
                <Button onClick={() => setShowOnboardingModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Flow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Onboarding Flows Yet</h3>
                <p className="mb-4">
                  Create your first onboarding flow to help new members get started
                </p>
                <Button onClick={() => setShowOnboardingModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create First Flow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Promotional Campaigns</CardTitle>
                <Button onClick={() => setShowPromotionalModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Promotional Campaigns Yet</h3>
                <p className="mb-4">
                  Create your first campaign to engage and grow your community
                </p>
                <Button onClick={() => setShowPromotionalModal(true)}>
                  <Target className="w-4 h-4 mr-2" />
                  Create First Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p>
                  Detailed analytics and insights will be available once you create onboarding flows and campaigns
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onFlowCreated={() => {
          setShowOnboardingModal(false)
          // Refresh data if needed
        }}
      />

      <PromotionalContentModal
        isOpen={showPromotionalModal}
        onClose={() => setShowPromotionalModal(false)}
        onContentCreated={() => {
          setShowPromotionalModal(false)
          // Refresh data if needed
        }}
      />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
