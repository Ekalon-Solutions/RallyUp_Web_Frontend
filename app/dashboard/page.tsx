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
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-lg font-medium">Welcome back! Here's what's happening with your supporter group.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowCreateEventModal(true)}
                className="h-11 px-6 font-bold shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-95"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Create Event
              </Button>
              <CreateNewsModal 
                isOpen={showCreateNewsModal}
                onClose={() => setShowCreateNewsModal(false)}
                onSuccess={() => setShowCreateNewsModal(false)}
              />
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-2 shadow-sm rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading...</CardTitle>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">--</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 shadow-xl rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-8">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Active Members</CardTitle>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="text-4xl font-black tracking-tighter">{stats.activeMembers}</div>
                  <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    {stats.totalMembers} total members
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 shadow-xl rounded-[2rem] overflow-hidden group hover:border-green-500/50 transition-all duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-8">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Upcoming Events</CardTitle>
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="text-4xl font-black tracking-tighter">{stats.upcomingEvents}</div>
                  <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live match screenings & socials
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-xl rounded-[2rem] overflow-hidden group hover:border-purple-500/50 transition-all duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-8">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Store Revenue</CardTitle>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="text-4xl font-black tracking-tighter">₹{stats.storeRevenue.toLocaleString()}</div>
                  <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    Monthly merchandise sales
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Promotion Feed */}
          {user && 'club' in user && user.club && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 shadow-xl p-2">
              <PromotionFeed 
                clubId={typeof user.club === 'object' ? user.club._id : user.club} 
                limit={3} 
                showStats={true} 
              />
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Volunteer Quick Signup */}
            {user && 'club' in user && user.club && 'volunteering' in user && (
              <div className="lg:col-span-2">
                <VolunteerQuickSignup
                  onSignup={() => window.location.href = '/dashboard/volunteer'}
                  currentProfile={user.volunteering}
                  isSignedUp={user.volunteering?.isVolunteer || false}
                />
              </div>
            )}

            {/* Quick Actions */}
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  Quick Actions
                </CardTitle>
                <CardDescription className="font-bold text-sm uppercase tracking-widest text-muted-foreground mt-2">Shortcuts & Tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start bg-muted/30 border-2 hover:bg-muted/50 transition-all rounded-2xl group font-bold px-6"
                  onClick={() => window.location.href = '/dashboard/events'}
                >
                  <Calendar className="w-5 h-5 mr-3 text-green-600 group-hover:scale-110 transition-transform" />
                  View Events
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start bg-muted/30 border-2 hover:bg-muted/50 transition-all rounded-2xl group font-bold px-6"
                  onClick={() => window.location.href = '/dashboard/members'}
                >
                  <Users className="w-5 h-5 mr-3 text-blue-600 group-hover:scale-110 transition-transform" />
                  Manage Members
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start bg-muted/30 border-2 hover:bg-muted/50 transition-all rounded-2xl group font-bold px-6"
                  onClick={() => setShowCreateNewsModal(true)}
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-purple-600 group-hover:scale-110 transition-transform" />
                  Create News
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Volunteer Opportunities Widget */}
          {user && 'club' in user && user.club && (
            <div className="rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card">
              <VolunteerOpportunitiesWidget
                opportunities={[]}
                onViewAll={() => window.location.href = '/dashboard/volunteer'}
                onSignUp={(opportunityId, timeSlotId) => {
                  window.location.href = `/dashboard/volunteer?signup=${opportunityId}&slot=${timeSlotId}`;
                }}
              />
            </div>
          )}

          {/* Polls Widget */}
          {user && 'club' in user && user.club && (
            <div className="rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
              <PollsWidget limit={3} showCreateButton={true} />
            </div>
          )}

          {/* Club Information for Admins */}
          {user && 'club' in user && user.club && ['admin', 'super_admin', 'system_owner'].includes(user.role) && (
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/20">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  Club Management
                </CardTitle>
                <CardDescription className="font-bold text-sm uppercase tracking-widest text-muted-foreground mt-2">
                  Key status and information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Club Name</Label>
                    <p className="text-xl font-black tracking-tight">
                      {typeof user.club === 'object' ? user.club.name : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                    <div>
                      <Badge className={cn("px-4 py-1.5 font-black uppercase tracking-widest text-[10px]", typeof user.club === 'object' && user.club.status === 'active' ? "bg-green-500 text-white" : "bg-slate-500 text-white")}>
                        {typeof user.club === 'object' ? user.club.status : 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Role</Label>
                    <div>
                      <Badge variant="outline" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] border-2">
                        {user.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {typeof user.club === 'object' && user.club.settings && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Max Members</Label>
                        <p className="text-xl font-black tracking-tight">{user.club.settings.maxMembers.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Registration</Label>
                        <p className="text-xl font-black tracking-tight">{user.club.settings.allowPublicRegistration ? 'Enabled' : 'Disabled'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Approval Required</Label>
                        <p className="text-xl font-black tracking-tight">{user.club.settings.requireApproval ? 'Yes' : 'No'}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
