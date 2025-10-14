"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  AlertCircle,
  Edit,
  Trash2
} from "lucide-react"
import OnboardingModal from "@/components/modals/onboarding-modal"
import PromotionalContentModal from "@/components/modals/promotional-content-modal"
import { PromotionFeed } from "@/components/promotion-feed"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import UserOnboardingProgressAdmin from "@/components/admin/user-onboarding-progress-admin"

interface OnboardingFlow {
  _id: string
  name: string
  description: string
  steps: any[]
  targetAudience: 'new_members' | 'existing_members' | 'all'
  isActive: boolean
  estimatedDuration: number
  createdAt: string
}

interface Promotion {
  _id: string
  title: string
  description?: string
  type: 'banner' | 'popup' | 'email' | 'sms' | 'notification' | 'sidebar'
  content: {
    text?: string
    image?: string
    video?: string
    link?: string
    buttonText?: string
    buttonAction?: string
  }
  targeting: {
    audience: 'all' | 'members' | 'non-members' | 'specific-clubs' | 'specific-users'
    clubs?: string[]
    users?: string[]
    userRoles?: string[]
    userInterests?: string[]
  }
  scheduling: {
    startDate: string
    endDate: string
    timezone: string
  }
  display: {
    priority: number
    frequency: 'once' | 'daily' | 'weekly' | 'always'
    position?: string
  }
  tracking: {
    impressions: number
    clicks: number
    conversions: number
  }
  status: 'active' | 'inactive' | 'draft' | 'scheduled' | 'expired'
  club?: string
  createdAt: string
  updatedAt: string
}

export default function OnboardingDashboard() {
  const { user } = useAuth()
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [showPromotionalModal, setShowPromotionalModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Fetch flows and promotions when component mounts
  useEffect(() => {
    fetchFlows()
    fetchPromotions()
  }, [])

  const fetchFlows = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setFlows(data.flows || [])
      } else {
        console.error('Failed to fetch flows')
      }
    } catch (error) {
      console.error('Error fetching flows:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromotions = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.getAll))
      
      if (response.ok) {
        const data = await response.json()
        setPromotions(data.data || [])
      } else {
        console.error('Failed to fetch promotions')
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
    }
  }

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setShowPromotionalModal(true)
  }

  const handleStatusChange = async (promotionId: string, newStatus: string) => {
    try {
      setUpdatingStatus(promotionId)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.status(promotionId)), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Promotion status updated to ${newStatus}`)
        fetchPromotions() // Refresh the list
      } else {
        toast.error('Failed to update promotion status')
      }
    } catch (error) {
      console.error('Error updating promotion status:', error)
      toast.error('Failed to update promotion status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const toggleFlowStatus = async (flowId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows) + `/${flowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast.success(`Flow ${isActive ? 'activated' : 'deactivated'} successfully!`)
        fetchFlows() // Refresh the list
      } else {
        toast.error('Failed to update flow status')
      }
    } catch (error) {
      console.error('Error toggling flow status:', error)
      toast.error("Failed to update flow status")
    }
  }

  const deleteFlow = async (flowId: string) => {
    if (!confirm("Are you sure you want to delete this onboarding flow? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows) + `/${flowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Onboarding flow deleted successfully!")
        fetchFlows() // Refresh the list
      } else {
        toast.error("Failed to delete flow")
      }
    } catch (error) {
      console.error('Error deleting flow:', error)
      toast.error("Failed to delete flow")
    }
  }

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
                <div className="text-2xl font-bold">{promotions.filter(p => p.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">
                  {promotions.filter(p => p.status === 'draft').length} in draft
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

           {/* Promotional Content Feed */}
           <PromotionFeed 
             clubId={user?.club?._id}
             limit={3}
             showStats={true}
           />
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
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading onboarding flows...</p>
                </div>
              ) : flows.length === 0 ? (
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
              ) : (
                <div className="grid gap-4">
                  {flows.map((flow) => (
                    <Card key={flow._id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{flow.name}</h4>
                          <p className="text-sm text-muted-foreground">{flow.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={flow.isActive ? "success" : "secondary"}>
                            {flow.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFlowStatus(flow._id, !flow.isActive)}
                          >
                            {flow.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFlow(flow._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>Steps: {flow.steps.length}</p>
                        <p>Duration: {flow.estimatedDuration} minutes</p>
                        <p>Target Audience: {flow.targetAudience}</p>
                        <p>Created: {new Date(flow.createdAt).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Progress Tracking */}
          <UserOnboardingProgressAdmin />
        </TabsContent>

                 <TabsContent value="promotions" className="space-y-6">
                       {/* Promotional Content Feed */}
            <PromotionFeed 
              clubId={user?.club?._id}
              limit={5}
              showStats={true}
            />
           
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle>Manage Campaigns</CardTitle>
                 <Button onClick={() => setShowPromotionalModal(true)}>
                   <Plus className="w-4 h-4 mr-2" />
                   Create New Campaign
                 </Button>
               </div>
             </CardHeader>
             <CardContent>
               {promotions && promotions.length > 0 ? (
                 <div className="space-y-4">
                   {promotions.map((promotion) => (
                     <Card key={promotion._id} className="hover:shadow-md transition-shadow">
                       <CardContent className="p-4">
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                 <Target className="w-4 h-4 text-blue-600" />
                               </div>
                               <h3 className="font-semibold">{promotion.title}</h3>
                               <Badge variant="outline" className={promotion.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                 {promotion.status}
                               </Badge>
                               <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                 {promotion.type}
                               </Badge>
                               <Select
                                 value={promotion.status}
                                 onValueChange={(newStatus) => handleStatusChange(promotion._id, newStatus)}
                                 disabled={updatingStatus === promotion._id}
                               >
                                 <SelectTrigger className="w-28 h-8 text-xs">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="draft">Draft</SelectItem>
                                   <SelectItem value="active">Active</SelectItem>
                                   <SelectItem value="inactive">Inactive</SelectItem>
                                   <SelectItem value="scheduled">Scheduled</SelectItem>
                                   <SelectItem value="expired">Expired</SelectItem>
                                 </SelectContent>
                               </Select>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="h-8 px-3 text-xs"
                                 onClick={() => handleStatusChange(promotion._id, promotion.status === 'active' ? 'inactive' : 'active')}
                                 disabled={updatingStatus === promotion._id}
                               >
                                 {updatingStatus === promotion._id ? 'Updating...' : (promotion.status === 'active' ? 'Deactivate' : 'Activate')}
                               </Button>
                             </div>
                             
                             {promotion.description && (
                               <p className="text-sm text-muted-foreground mb-2">
                                 {promotion.description}
                               </p>
                             )}
                             
                             <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                               <span className="flex items-center gap-1">
                                 <Target className="w-4 h-4" />
                                 {promotion.targeting?.audience?.replace('-', ' ') || 'all'}
                               </span>
                               {promotion.scheduling?.startDate && (
                                 <span className="flex items-center gap-1">
                                   <Clock className="w-4 h-4" />
                                   {new Date(promotion.scheduling.startDate).toLocaleDateString()}
                                 </span>
                               )}
                             </div>

                                                           <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>👁️ {promotion.tracking?.impressions || 0} views</span>
                                <span>🖱️ {promotion.tracking?.clicks || 0} clicks</span>
                                <span>🎯 {promotion.tracking?.conversions || 0} conversions</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Select
                                value={promotion.status}
                                onValueChange={(newStatus) => handleStatusChange(promotion._id, newStatus)}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPromotion(promotion)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               ) : (
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
               )}
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
          fetchFlows() // Refresh the flows list
        }}
      />

      <PromotionalContentModal
        isOpen={showPromotionalModal}
        onClose={() => {
          setShowPromotionalModal(false)
          setEditingPromotion(null) // Reset editing state
        }}
        onContentCreated={() => {
          setShowPromotionalModal(false)
          setEditingPromotion(null) // Reset editing state
          fetchPromotions() // Refresh the promotions list
        }}
        editingPromotion={editingPromotion}
      />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
