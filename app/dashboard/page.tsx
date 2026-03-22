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
import LeagueTableWidget from "@/components/league-table-widget"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/lib/config"
import { apiClient } from "@/lib/api"
import { useClubSettings } from "@/hooks/useClubSettings"
import { toast } from 'sonner'

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  upcomingEvents: number
  storeRevenue: number
}

// Component: display upcoming fixtures for the user's active club
function FixturesCards({ clubId }: { clubId?: string | undefined }) {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const INITIAL_COUNT = 6

  // helper to format startTime into "DD Month YYYY (Weekday) HH:MM IST"
  // The backend (IST server) stores TheSportsDB UTC times as-if they were IST,
  // effectively saving them 5:30h behind the real UTC. We add 5:30h back before displaying.
  const formatFixtureDate = (isoDate: string) => {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return ''
    const corrected = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
    const ist = { timeZone: 'Asia/Kolkata' }
    const day = Number(corrected.toLocaleString('en-IN', { ...ist, day: 'numeric' }))
    const month = corrected.toLocaleString('en-IN', { ...ist, month: 'long' })
    const year = corrected.toLocaleString('en-IN', { ...ist, year: 'numeric' })
    const weekday = corrected.toLocaleString('en-IN', { ...ist, weekday: 'long' })
    const hours = corrected.toLocaleString('en-IN', { ...ist, hour: '2-digit', hour12: false }).padStart(2, '0')
    const minutes = corrected.toLocaleString('en-IN', { ...ist, minute: '2-digit' }).padStart(2, '0')
    return `${day} ${month} ${year} (${weekday}) ${hours}:${minutes} IST`
  }

  useEffect(() => {
    if (!clubId) return
    const fetchFixtures = async () => {
      setLoading(true)
      try {
        const resp = await apiClient.listAvailableExternalTicketFixtures(clubId)
        const data = resp?.data?.data || []
        console.log("data:", data)

        const rawArr = Array.isArray(data) ? data : []
        // Deduplicate by _id to prevent double-rendering
        const seen = new Map<string, any>()
        rawArr.forEach((f) => seen.set(String(f._id), f))
        const fixturesArr = Array.from(seen.values())
        // Use corrected time (add 5.5h) for past/future split to match display logic
        const OFFSET_MS = 5.5 * 60 * 60 * 1000
        const now = new Date()
        const past = fixturesArr.filter((f) => new Date(new Date(f.startTime).getTime() + OFFSET_MS) < now)
        const future = fixturesArr.filter((f) => new Date(new Date(f.startTime).getTime() + OFFSET_MS) >= now)
        setFixtures([...past.slice(-1), ...future])
      } catch (e) {
        setFixtures([])
      } finally {
        setLoading(false)
      }
    }
    fetchFixtures()
  }, [clubId])

  const displayed = showAll ? fixtures : fixtures.slice(0, INITIAL_COUNT)

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Upcoming Matches</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          <div className="p-4">Loading matches...</div>
        ) : fixtures.length ? (
          displayed.map((f) => {
            const fixtureDate = new Date(f.startTime)
            const isPast = fixtureDate < new Date()
            const hasScore = typeof f.homeScore === 'number' && typeof f.awayScore === 'number'
            const scoreText = hasScore ? `${f.homeScore} - ${f.awayScore}` : null
            const detailedScoreText = hasScore && f.homeTeam && f.awayTeam
              ? `${f.homeTeam} ${f.homeScore} - ${f.awayScore} ${f.awayTeam}`
              : scoreText

            return (
              <Card key={String(f._id)}>
                <CardHeader className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    {f.homeTeamBadge ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.homeTeamBadge} alt={f.homeTeam || 'home'} className="w-8 h-8 object-contain" />
                    ) : null}
                    <CardTitle className="text-sm font-medium">{f.title}</CardTitle>
                    {f.awayTeamBadge ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.awayTeamBadge} alt={f.awayTeam || 'away'} className="w-8 h-8 object-contain" />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">{f.competition}</div>
                  {isPast && detailedScoreText ? (
                    <div className="text-base font-semibold mt-2 text-green-600">{detailedScoreText}</div>
                  ) : (
                    <div className="text-base font-semibold mt-2">{formatFixtureDate(f.startTime)}</div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="p-4">No upcoming matches</div>
        )}
      </div>
      {fixtures.length > INITIAL_COUNT && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {showAll ? 'Show Less' : `Show More (${fixtures.length - INITIAL_COUNT} more)`}
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading, activeClubId } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogo, setShowLogo] = useState(false)
  const [logoFadeIn, setLogoFadeIn] = useState(false)
  const [cronLoading, setCronLoading] = useState(false)

  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/dashboard/user"
    }
    if (user?.role === 'system_owner') {
      window.location.href = "/dashboard/club-management"
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

        const clubStatsResponse = await apiClient.getClubStats(clubId)

        const eventsResponse = await apiClient.getPublicEvents(clubId)
        const eventsList = Array.isArray(eventsResponse.data) ? eventsResponse.data : (eventsResponse.data?.events || [])
        const upcomingEvents = eventsList.filter((event: any) =>
          new Date(event.startTime || event.date) >= new Date()
        ).length

        const orderStatsResponse = await apiClient.getOrderStats()
        const orderStatsData = orderStatsResponse.success ? orderStatsResponse.data : { totalRevenue: 0 }

        setStats({
          totalMembers: clubStatsResponse.data?.totalMembers || 0,
          activeMembers: clubStatsResponse.data?.activeMembers || 0,
          upcomingEvents,
          storeRevenue: orderStatsData.totalRevenue || 0
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
    const { activeClubId } = useAuth();

    // If the user is an admin, prefer the admin's selected/active club
    if (user.role === 'admin') {
      const adminClubs = user.clubs || [];
      const currentClub = adminClubs.find((c) => c._id === activeClubId) ?? adminClubs?.[0];
      if (currentClub) return currentClub?._id;
      if (userAny?.club?._id) return userAny.club._id
      if (Array.isArray(userAny?.clubs) && userAny.clubs.length) {
        const firstClub = userAny.clubs[0]
        return firstClub?._id || firstClub
      }
      // fallthrough to memberships if present
    }

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
  console.log("club settings:", clubSettings)

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
            {/* {isAdmin && (
              <div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!confirm('Run fetch-next-matches for all clubs now?')) return
                    try {
                      setCronLoading(true)
                      const token = localStorage.getItem('token')
                      const cronResp = await apiClient.get('/cron/sports/fetch-next-matches')
                      if (cronResp.success) {
                        const data = cronResp.data || { processed: 0 }
                        toast.success(`Cron completed: ${data.processed} clubs`)
                      } else {
                        toast.error(`Cron failed: ${cronResp.status || ''} ${cronResp.message || cronResp.error || ''}`)
                      }
                    } catch (e: any) {
                      toast.error('Cron request failed')
                    } finally {
                      setCronLoading(false)
                    }
                  }}
                  disabled={cronLoading}
                >
                  {cronLoading ? 'Running...' : 'Fetch Next Matches'}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!confirm('Refresh league tables for all clubs now?')) return
                    try {
                      setCronLoading(true)
                      const cronResp = await apiClient.post('/cron/sports/refresh-league-tables', {})
                      if (cronResp.success) {
                        toast.success('League tables refreshed successfully')
                      } else {
                        toast.error(`Refresh failed: ${cronResp.status || ''} ${cronResp.message || cronResp.error || ''}`)
                      }
                    } catch (e: any) {
                      toast.error('Refresh request failed')
                    } finally {
                      setCronLoading(false)
                    }
                  }}
                  disabled={cronLoading}
                  className="ml-2"
                >
                  {cronLoading ? 'Running...' : 'Refresh League Tables'}
                </Button>
              </div>
            )} */}
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
              {/* Upcoming matches (fixtures) */}
              <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-4">
                <FixturesCards clubId={clubId} />
              </div>

              {/* League Table Widget */}
              {clubSettings?.sports?.teamId && (
                <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-4">
                  <LeagueTableWidget leagueId={clubSettings.sports.leagueId} />
                </div>
              )}

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
