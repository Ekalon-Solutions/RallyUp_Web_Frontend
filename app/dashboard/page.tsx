"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, ShoppingBag, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { PollsWidget } from "@/components/polls-widget"
import { LatestEventsWidget } from "@/components/latest-events-widget"
import { LatestNewsWidget } from "@/components/latest-news-widget"
import { getApiUrl } from "@/lib/config"
import axios from "axios"
import { useClubSettings } from "@/hooks/useClubSettings"

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  upcomingEvents: number
  storeRevenue: number
}

export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading, activeClubId } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogo, setShowLogo] = useState(false)
  const [logoFadeIn, setLogoFadeIn] = useState(false)
  
  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/dashboard/user"
    }
  }, [user, isAdmin])

  useEffect(() => {
    const hasSeenDashboardLogo = localStorage.getItem('hasSeenDashboardLogo')
    
    if (!hasSeenDashboardLogo && user) {
      setShowLogo(true)
      setTimeout(() => {
        setLogoFadeIn(true)
      }, 50)
      
      const fadeOutTimer = setTimeout(() => {
        setShowLogo(false)
        localStorage.setItem('hasSeenDashboardLogo', 'true')
      }, 2000)
      
      return () => clearTimeout(fadeOutTimer)
    }
  }, [user])

  useEffect(() => { 
    if (authLoading) {
      return
    }

    let noClubTimer: ReturnType<typeof setTimeout> | undefined

    const resolveClubId = () => {
      if (!user || user.role === 'system_owner') return undefined
      const userAny = user as any

      if (activeClubId) return activeClubId

      if (userAny?.club?._id) return userAny.club._id
      if (userAny?.club && typeof userAny.club === 'string') return userAny.club

      const firstMembership = userAny?.memberships?.find((m: any) => m.status === 'active')
      return firstMembership?.club_id?._id || firstMembership?.club_id
    }

    const fetchDashboardStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      const clubId = resolveClubId()
      if (!clubId) {
        setStats(null)
        setLoading(true)
        noClubTimer = setTimeout(() => setLoading(false), 2500)
        return
      }

      try {
        setLoading(true)
        const token = localStorage.getItem('token')

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
        setStats({
          totalMembers: 0,
          activeMembers: 0,
          upcomingEvents: 0,
          storeRevenue: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()

    return () => {
      if (noClubTimer) clearTimeout(noClubTimer)
    }
  }, [user, authLoading, activeClubId])
  
  const getClubInfo = () => {
    const userAny = user as any
    let clubLogo: string | undefined
    let clubName: string | undefined
    
    if (activeClubId) {
      const activeMembership = userAny?.memberships?.find(
        (m: any) => (m.club_id?._id || m.club_id) === activeClubId && m.status === 'active'
      )
      if (activeMembership?.club_id) {
        clubLogo = activeMembership.club_id.logo
        clubName = activeMembership.club_id.name
      }
    }
    
    if (!clubName && userAny?.club) {
      clubLogo = userAny.club.logo
      clubName = userAny.club.name
    }
    
    if (!clubName) {
      const firstMembership = userAny?.memberships?.find((m: any) => m.status === 'active')
      clubLogo = firstMembership?.club_id?.logo
      clubName = firstMembership?.club_id?.name
    }
    
    return { clubLogo, clubName }
  }
  
  const { clubLogo, clubName } = getClubInfo()
  
  const getUserClubId = () => {
    if (!user || user.role === 'system_owner') return undefined
    const userAny = user as any
    
    if (activeClubId) {
      return activeClubId
    }
    
    if (userAny?.club?._id) {
      return userAny.club._id
    }
    
    const firstMembership = userAny?.memberships?.find((m: any) => m.status === 'active')
    return firstMembership?.club_id?._id || firstMembership?.club_id
  }
  
  const clubId = getUserClubId()
  const { settings: clubSettings } = useClubSettings(clubId)
  
  const settingsLogo = clubSettings ? ((clubSettings as any).designSettings?.logo) : undefined
  const displayLogo = settingsLogo || clubLogo

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-1000 ease-in-out pointer-events-none ${showLogo ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`relative w-32 h-32 md:w-40 md:h-40 transition-all duration-1000 ease-in-out ${logoFadeIn && showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {displayLogo ? (
                <Image
                  src={displayLogo}
                  alt={clubName || "Club logo"}
                  fill
                  sizes="160px"
                  className="object-contain"
                  priority
                />
              ) : (
                <Image
                  src="/WingmanPro Logo (White BG).svg"
                  alt="Wingman Pro logo"
                  fill
                  sizes="160px"
                  className="object-contain"
                  priority
                />
              )}
            </div>
          </div>
          {/* Header - consistent with other admin sections */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Welcome back! Here's what's happening with your supporter group.</p>
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                  <div className="text-2xl font-bold text-blue-600">{stats.activeMembers}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalMembers} total members</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Calendar className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.upcomingEvents}</div>
                  <p className="text-xs text-muted-foreground mt-1">Live match screenings & socials</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Store Revenue</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">₹{stats.storeRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Monthly merchandise sales</p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {user && (clubName || ('club' in user && user.club)) && (
            <div className="space-y-6">
              <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
                <LatestEventsWidget limit={5} showManageButton={true} />
              </div>
              <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
                <LatestNewsWidget limit={5} showManageButton={true} />
              </div>
              <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-2">
                <PollsWidget limit={5} showCreateButton={true} />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
