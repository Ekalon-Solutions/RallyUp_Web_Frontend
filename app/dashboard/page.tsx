"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ShoppingBag, Building2, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { CreateNewsModal } from "@/components/modals/create-news-modal"
import { VolunteerQuickSignup } from "@/components/volunteer/volunteer-quick-signup"
import { VolunteerOpportunitiesWidget } from "@/components/volunteer/volunteer-opportunities-widget"
import { PollsWidget } from "@/components/polls-widget"
import { LatestEventsWidget } from "@/components/latest-events-widget"
import { LatestNewsWidget } from "@/components/latest-news-widget"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"
import axios from "axios"

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  upcomingEvents: number
  storeRevenue: number
}

export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showCreateNewsModal, setShowCreateNewsModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/dashboard/user"
    }
  }, [user, isAdmin])

  useEffect(() => { 
    if (authLoading) {
      return
    }

    const fetchDashboardStats = async () => {
      if (!user || !('club' in user) || !user.club) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const clubId = typeof user.club === 'object' ? user.club._id : user.club

        const clubStatsResponse = await axios.get(
          getApiUrl(`/clubs/${clubId}/stats`),
          { headers: { Authorization: `Bearer ${token}` } }
        )

        const eventsResponse = await axios.get(
          getApiUrl(`/events/public`),
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 100 }
          }
        )
        const upcomingEvents = eventsResponse.data.events?.filter((event: any) => 
          new Date(event.date) >= new Date()
        ).length || 0

        const orderStatsResponse = await axios.get(
          getApiUrl(`/orders/admin/stats`),
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { totalRevenue: 0 } }))

        setStats({
          totalMembers: clubStatsResponse.data.totalMembers || 0,
          activeMembers: clubStatsResponse.data.activeMembers || 0,
          upcomingEvents,
          storeRevenue: orderStatsResponse.data.totalRevenue || 0
        })
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [user, authLoading])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-lg font-medium">Welcome back! Here's what's happening with your supporter group.</p>
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
                  <div className="text-4xl font-black">{stats.activeMembers}</div>
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
                  <div className="text-4xl font-black">{stats.upcomingEvents}</div>
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
                  <div className="text-4xl font-black">₹{stats.storeRevenue.toLocaleString()}</div>
                  <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    Monthly merchandise sales
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Latest Events, Latest News, Latest Polls */}
          {user && 'club' in user && user.club && (
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
                <LatestEventsWidget limit={3} showManageButton={true} />
              </div>
              <div className="rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
                <LatestNewsWidget limit={3} showManageButton={true} />
              </div>
              <div className="rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
                <PollsWidget limit={3} showCreateButton={true} />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
