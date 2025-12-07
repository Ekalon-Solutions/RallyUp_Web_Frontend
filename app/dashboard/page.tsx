"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ShoppingBag, TrendingUp, MessageSquare, BadgeIcon as IdCard, Bus, Building2 } from "lucide-react"
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

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  
  // Redirect users to their appropriate dashboard
  useEffect(() => {
    // console.log('Dashboard redirect check:', { user, isAdmin, userRole: user?.role })
    if (user && !isAdmin) {
      // console.log('Redirecting user to /dashboard/user')
      window.location.href = "/dashboard/user"
    }
  }, [user, isAdmin])

  const stats = [
    {
      title: "Active Members",
      value: "876",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Upcoming Events",
      value: "5",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Store Revenue",
      value: "₹1,250,000",
      icon: ShoppingBag,
      color: "text-purple-600",
    },
    {
      title: "Website Visitors",
      value: "4,500",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  const recentActivities = [
    { action: "New member registration", user: "Alice Brown", time: "1 hour ago" },
    { action: "Match ticket purchased", user: "Bob Williams", time: "3 hours ago" },
    { action: "Away day sign-up", user: "Charlie Davis", time: "5 hours ago" },
    { action: "Merchandise order", user: "David Garcia", time: "10 hours ago" },
  ]

  const upcomingFixtures = [
    { team: "Home vs. Rovers", date: "2024-03-10", time: "15:00" },
    { team: "Away vs. United", date: "2024-03-17", time: "17:30" },
  ]

  const memberEngagement = [
    { metric: "Match Attendance", value: "75%" },
    { metric: "Event Participation", value: "60%" },
    // { metric: "Forum Activity", value: "40%" },
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your supporter group.</p>
          </div>
          <CreateNewsModal />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Promotion Feed */}
        {user?.club && (
          <PromotionFeed 
            clubId={user.club._id} 
            limit={3} 
            showStats={true} 
          />
        )}

        {/* Volunteer Quick Signup */}
        {user?.club && (
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
                  onClick={() => window.location.href = '/dashboard/news'}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Create News
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Volunteer Opportunities Widget */}
        {user?.club && (
          <VolunteerOpportunitiesWidget
            opportunities={[]} // This would be populated with actual data
            onViewAll={() => window.location.href = '/dashboard/volunteer'}
            onSignUp={(opportunityId, timeSlotId) => {
              // Handle signup - redirect to volunteer page
              window.location.href = `/dashboard/volunteer?signup=${opportunityId}&slot=${timeSlotId}`;
            }}
          />
        )}

        {/* Polls Widget */}
        {user?.club && (
          <PollsWidget limit={3} showCreateButton={true} />
        )}

        {/* Club Information for Admins */}
        {user?.club && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'system_owner') && (
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
                  <p className="text-sm font-medium">{user.club.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={user.club.status === 'active' ? "default" : "secondary"}>
                    {user.club.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Your Role</Label>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </div>
                {user.club.settings && (
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Group Message
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => setShowCreateEventModal(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Match Event
              </Button>
              <CreateEventModal
                isOpen={showCreateEventModal}
                onClose={() => setShowCreateEventModal(false)}
                onSuccess={() => {
                  setShowCreateEventModal(false)
                  // You can add any success logic here, like refreshing data
                }}
              />
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <IdCard className="w-4 h-4 mr-2" />
                Add Season Ticket Holder
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Bus className="w-4 h-4 mr-2" />
                Manage Away Day Travel
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your supporter group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Fixtures */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Fixtures</CardTitle>
            <CardDescription>Next matches for the team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingFixtures.map((fixture, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{fixture.team}</p>
                    <p className="text-xs text-muted-foreground">
                      {fixture.date} • {fixture.time}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Get Tickets
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Member Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Member Engagement</CardTitle>
            <CardDescription>Participation metrics for the group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberEngagement.map((engagement, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{engagement.metric}</p>
                  <p className="text-sm">{engagement.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Get Started
              <Badge variant="secondary">
                {user ? calculateUserProfileCompletion(user as any) : 0}% completed
              </Badge>
            </CardTitle>
            <CardDescription>Complete these steps to set up your club</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Add your first members</span>
                <Button size="sm" variant="outline">
                  Start
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Configure payment settings</span>
                <Button size="sm" variant="outline">
                  Setup
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Create your first event</span>
                <Button size="sm" variant="outline">
                  Create
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
