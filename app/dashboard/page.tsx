"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ShoppingBag, MessageSquare, BadgeIcon as IdCard, Bus, Building2, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { CreateNewsModal } from "@/components/modals/create-news-modal"
import { CreateEventModal } from "@/components/modals/create-event-modal"
import { VolunteerQuickSignup } from "@/components/volunteer/volunteer-quick-signup"
import { VolunteerOpportunitiesWidget } from "@/components/volunteer/volunteer-opportunities-widget"
import { PromotionFeed } from "@/components/promotion-feed"
import { PollsWidget } from "@/components/polls-widget"
import { calculateUserProfileCompletion } from "@/lib/user-completion"
import axios from "axios"

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  upcomingEvents: number
  storeRevenue: number
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showCreateNewsModal, setShowCreateNewsModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Redirect users to their appropriate dashboard
  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/dashboard/user"
    }
  }, [user, isAdmin])

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || !('club' in user) || !user.club) {
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        const clubId = typeof user.club === 'object' ? user.club._id : user.club

        // Fetch club stats
        const clubStatsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clubs/${clubId}/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Fetch upcoming events count
        const eventsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/events/public`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 100 }
          }
        )
        const upcomingEvents = eventsResponse.data.events?.filter((event: any) => 
          new Date(event.date) >= new Date()
        ).length || 0

        // Fetch order stats for revenue
        const orderStatsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/orders/admin/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { totalRevenue: 0 } }))

        setStats({
          totalMembers: clubStatsResponse.data.totalMembers || 0,
          activeMembers: clubStatsResponse.data.activeMembers || 0,
          upcomingEvents,
          storeRevenue: orderStatsResponse.data.totalRevenue || 0
        })
      } catch (error) {
        // console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [user])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your supporter group.</p>
          </div>
          <CreateNewsModal 
            isOpen={showCreateNewsModal}
            onClose={() => setShowCreateNewsModal(false)}
            onSuccess={() => setShowCreateNewsModal(false)}
          />
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalMembers} total members
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled events
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Revenue</CardTitle>
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.storeRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total merchandise sales
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Promotion Feed */}
        {user && 'club' in user && user.club && (
          <PromotionFeed 
            clubId={typeof user.club === 'object' ? user.club._id : user.club} 
            limit={3} 
            showStats={true} 
          />
        )}

        {/* Volunteer Quick Signup */}
        {user && 'club' in user && user.club && 'volunteering' in user && (
          <div className="grid gap-4 md:grid-cols-2">
            <VolunteerQuickSignup
              onSignup={() => window.location.href = '/dashboard/volunteer'}
              currentProfile={user.volunteering}
              isSignedUp={user.volunteering?.isVolunteer || false}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard/events'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Events
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard/members'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Members
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateNewsModal(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Create News
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Volunteer Opportunities Widget */}
        {user && 'club' in user && user.club && (
          <VolunteerOpportunitiesWidget
            opportunities={[]}
            onViewAll={() => window.location.href = '/dashboard/volunteer'}
            onSignUp={(opportunityId, timeSlotId) => {
              window.location.href = `/dashboard/volunteer?signup=${opportunityId}&slot=${timeSlotId}`;
            }}
          />
        )}

        {/* Polls Widget */}
        {user && 'club' in user && user.club && (
          <PollsWidget limit={3} showCreateButton={true} />
        )}

        {/* Club Information for Admins */}
        {user && 'club' in user && user.club && ['admin', 'super_admin', 'system_owner'].includes(user.role) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Club Management
              </CardTitle>
              <CardDescription>
                Overview of your club's current status and key information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Club Name</Label>
                  <p className="text-sm font-medium">
                    {typeof user.club === 'object' ? user.club.name : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={typeof user.club === 'object' && user.club.status === 'active' ? "default" : "secondary"}>
                    {typeof user.club === 'object' ? user.club.status : 'N/A'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Your Role</Label>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </div>
                {typeof user.club === 'object' && user.club.settings && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Max Members</Label>
                      <p className="text-sm">{user.club.settings.maxMembers}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Public Registration</Label>
                      <p className="text-sm">{user.club.settings.allowPublicRegistration ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Approval Required</Label>
                      <p className="text-sm">{user.club.settings.requireApproval ? 'Yes' : 'No'}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Manage your club content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => setShowCreateNewsModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Create News Article
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => setShowCreateEventModal(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <CreateEventModal
                isOpen={showCreateEventModal}
                onClose={() => setShowCreateEventModal(false)}
                onSuccess={() => {
                  setShowCreateEventModal(false)
                }}
              />
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => window.location.href = '/dashboard/merchandise'}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Manage Merchandise
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => window.location.href = '/dashboard/members'}
              >
                <Users className="w-4 h-4 mr-2" />
                View Members
              </Button>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Get Started
                <Badge variant="secondary">
                  {user ? calculateUserProfileCompletion(user as any) : 0}% completed
                </Badge>
              </CardTitle>
              <CardDescription>Complete your profile setup</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Complete your profile</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/settings'}
                  >
                    Update
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Add club members</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/members'}
                  >
                    Start
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Create your first event</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowCreateEventModal(true)}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
