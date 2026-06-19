"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import NewsReadMoreModal from "@/components/modals/news-readmore-modal"
import { apiClient, Event, News, User, Admin } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { isUserRegisteredForEvent as isUserRegisteredOnEvent, getUserRegistrationStatus, extractCancellableAttendeesFromApiResponse } from "@/lib/event-registration"
import { formatLocalDate } from "@/lib/timezone"
import { Calendar, MapPin, Clock, Users, Newspaper, Tag, User as UserIcon, Eye, CreditCard, Crown, Star, Shield, Infinity as InfinityIcon, Trash } from "lucide-react"
import EventDetailsModal from '@/components/modals/event-details-modal'
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal"
import { RefundConfirmationModal } from "@/components/modals/refund-confirmation-modal"
import { AttendeeTicketSelectModal, CancellableAttendee } from "@/components/modals/attendee-ticket-select-modal"
import { MemberTicketRefundAction } from "@/components/member/member-ticket-refund-action"
import { RefundPolicyBadge } from "@/components/refund-policy-badge"
import { EventImage } from "@/components/events/event-image"
import { eventVariantUrl } from "@/lib/eventImageCache"
import { isEventPaid } from "@/lib/event-display-price"

function AttendanceMarker({ event, userId }: { event: Event; userId?: string }) {
  const [registration, setRegistration] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!event || !userId) {
      setRegistration(null)
      setLoading(false)
      return
    }

    const regs = (event.registrations || []) as any[]
    const myRegEntry = regs.find(
      (r) => r && String(r.userId) === String(userId) && r.registrationId
    )

    if (myRegEntry && myRegEntry.registrationId) {
      setLoading(true)
      apiClient
        .getRegistrationById(String(myRegEntry.registrationId))
        .then((res) => {
          if (res && res.success && res.data && res.data.registration) {
            setRegistration(res.data.registration)
          } else {
            setRegistration(null)
          }
        })
        .catch(() => {
          setRegistration(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setRegistration(null)
      setLoading(false)
    }
  }, [event, userId])

  if (loading) {
    return (
      <Badge variant="secondary" className="w-fit ml-auto text-sm mt-1 flex items-center gap-1">
        <UserIcon className="w-3 h-3" />
        <span>...</span>
      </Badge>
    )
  }

  if (!registration || !Array.isArray(registration.attendees)) {
    return null
  }

  const totalRegistrations = registration.attendees.length
  const totalAttended = registration.attendees.filter(
    (att: any) => att.attended === true
  ).length

  return (
    <Badge
      variant="secondary"
      className="w-fit ml-auto text-sm mt-1 flex items-center gap-1">
      <UserIcon className="w-3 h-3" />
      <span>{totalAttended}/{totalRegistrations}</span>
    </Badge>
  )
}
import { MembershipStatus } from "@/components/membership-status"
import { PollsWidget } from "@/components/polls-widget"
import LeagueTableWidget from "@/components/league-table-widget"
import { useClubSettings } from "@/hooks/useClubSettings"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

function FixturesCards({ clubId }: { clubId?: string | undefined }) {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const INITIAL_COUNT = 6

  const formatFixtureDate = (isoDate: string) => {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return ''
    const ist = { timeZone: 'Asia/Kolkata' }
    const day = Number(d.toLocaleString('en-IN', { ...ist, day: 'numeric' }))
    const month = d.toLocaleString('en-IN', { ...ist, month: 'long' })
    const year = d.toLocaleString('en-IN', { ...ist, year: 'numeric' })
    const weekday = d.toLocaleString('en-IN', { ...ist, weekday: 'long' })
    const hours = d.toLocaleString('en-IN', { ...ist, hour: '2-digit', hour12: false }).padStart(2, '0')
    const minutes = d.toLocaleString('en-IN', { ...ist, minute: '2-digit' }).padStart(2, '0')
    return `${day} ${month} ${year} (${weekday}) ${hours}:${minutes} IST`
  }

  useEffect(() => {
    if (!clubId) return
    const fetchFixtures = async () => {
      setLoading(true)
      try {
        const resp = await apiClient.listAvailableExternalTicketFixtures(clubId) as any
        const data = resp?.data?.data || []

        const rawArr = Array.isArray(data) ? data : []
        const seen = new Map<string, any>()
        rawArr.forEach((f) => seen.set(String(f._id), f))
        const fixturesArr = Array.from(seen.values())
        const now = new Date()
        const past = fixturesArr.filter((f) => new Date(f.startTime) < now)
        const future = fixturesArr.filter((f) => new Date(f.startTime) >= now)
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
                      <img src={f.homeTeamBadge} alt={f.homeTeam || 'home'} className="w-8 h-8 object-contain" />
                    ) : null}
                    <CardTitle className="text-sm font-medium">{f.title}</CardTitle>
                    {f.awayTeamBadge ? (
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
            className="text-sm text-black dark:text-white underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {showAll ? 'Show Less' : `Show More (${fixtures.length - INITIAL_COUNT} more)`}
          </button>
        </div>
      )}
    </div>
  )
}

export default function UserDashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const clubId = useRequiredClubId()
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [onePointValue, setOnePointValue] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")
  const [showReadMoreModal, setShowReadMoreModal] = useState(false)
  const [selectedNewsForReadMore, setSelectedNewsForReadMore] = useState<News | null>(null)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map())
  const [showVenueTierCartModal, setShowVenueTierCartModal] = useState(false)
  const [venueTierEvent, setVenueTierEvent] = useState<Event | null>(null)
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null)
  const [refundCancelEventId, setRefundCancelEventId] = useState<string | null>(null)
  const [refundCancelAttendeeId, setRefundCancelAttendeeId] = useState<string | null>(null)
  const [refundEstimate, setRefundEstimate] = useState<any | null>(null)
  const [refundModalLoading, setRefundModalLoading] = useState(false)
  const [refundModalError, setRefundModalError] = useState<string | null>(null)
  const [attendeeSelectOpen, setAttendeeSelectOpen] = useState(false)
  const [attendeeSelectList, setAttendeeSelectList] = useState<CancellableAttendee[]>([])
  const [attendeeSelectMode, setAttendeeSelectMode] = useState<'refund' | 'cancel'>('refund')
  const [pendingRefundEventId, setPendingRefundEventId] = useState<string | null>(null)
  const [showLogo, setShowLogo] = useState(false)

  const activeMembership = useMemo(() => {
    if (!user || user.role === "system_owner") return null
    if (!clubId) return null
    const userAny: any = user
    const memberships = Array.isArray(userAny?.memberships) ? userAny.memberships : []
    const normalizeClubId = (club: any): string | null => {
      if (!club) return null
      if (typeof club === "string") return club
      if (club?._id) return String(club._id)
      return null
    }
    return (
      memberships.find(
        (m: any) =>
          m?.status === "active" &&
          (normalizeClubId(m?.club_id) === clubId || normalizeClubId(m?.club) === clubId),
      ) || null
    )
  }, [clubId, user])

  const userClub = (activeMembership as any)?.club_id || (activeMembership as any)?.club || null

  const { settings: clubSettings, isSectionVisible } = useClubSettings(clubId || undefined)

  const getUserDisplayName = () => {
    if (!user) return 'Member';

    if (user.name) {
      return user.name;
    }

    if (user && typeof user === 'object') {
      const userAny = user as any;
      if (userAny.first_name && userAny.last_name) {
        return `${userAny.first_name} ${userAny.last_name}`;
      }
      if (userAny.first_name) {
        return userAny.first_name;
      }
      if (userAny.last_name) {
        return userAny.last_name;
      }
    }

    return 'Member';
  }

  useEffect(() => {
    const hasSeenUserDashboardLogo = typeof window !== "undefined" && localStorage.getItem("hasSeenUserDashboardLogo")
    if (!hasSeenUserDashboardLogo && user) {
      setShowLogo(true)
      const fadeOutTimer = setTimeout(() => {
        setShowLogo(false)
        if (typeof window !== "undefined") localStorage.setItem("hasSeenUserDashboardLogo", "true")
      }, 2000)
      return () => clearTimeout(fadeOutTimer)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    fetchData()
  }, [clubId, user, authLoading])

  useEffect(() => {
    if (user) {
      fetchUserRegistrations()
    } else {
      setUserRegistrations(new Map())
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (!clubId) {
        setLoading(false)
        return
      }

      const [eventsResponse, newsResponse] = await Promise.all([
        apiClient.getPublicEvents(clubId),
        apiClient.getNewsByUserClub(clubId)
      ])

      if (eventsResponse.success && eventsResponse.data) {
        const eventsData = Array.isArray(eventsResponse.data) ? eventsResponse.data : (eventsResponse.data as any).events || []
        setEvents(eventsData)
      }

      try {
        if (user && clubId) {
          const [ptsResp, settingsResp] = await Promise.all([
            apiClient.getMemberPoints((user as any)._id, clubId),
            apiClient.getRedemptionSettings()
          ])
          if (ptsResp && ptsResp.success && ptsResp.data) {
            setTotalPoints(ptsResp.data.points || 0)
          }
          if (settingsResp && settingsResp.success && settingsResp.data) {
            setOnePointValue(Number(settingsResp.data.onePointValue) || 0)
          }
        } else {
          setTotalPoints(null)
        }
      } catch (e) {
      }

      if (user) {
        await fetchUserRegistrations()
      } else {
        setUserRegistrations(new Map())
      }

      if (newsResponse.success && newsResponse.data) {
        const newsData = Array.isArray(newsResponse.data) ? newsResponse.data : (newsResponse.data as any).news || []
        setNews(newsData)
      }
    } catch (error) {
      toast.error("Error loading dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRegistrations = async () => {
    if (!user) {
      setUserRegistrations(new Map())
      return
    }
    try {
      const response = await apiClient.getUserEventRegistrations()
      if (response.success && response.data) {
        const registrationsMap = new Map<string, any>()
        response.data.forEach((reg: any) => {
          registrationsMap.set(reg.eventId, reg.registration)
        })
        setUserRegistrations(registrationsMap)
      }
    } catch (error) {
    }
  }

  const handleRegisterForEvent = (event: Event) => {
    if (!user) {
      toast.error("Please log in to register for events")
      return
    }
    setVenueTierEvent(event)
    setShowVenueTierCartModal(true)
  }

  const handleCancelRegistration = async (eventId: string, attendeeId?: string) => {
    if (!eventId) return
    if (!attendeeId && !window.confirm("Are you sure you want to cancel your registration for this event?")) return
    try {
      setCancellingEventId(eventId)
      const res = await apiClient.cancelEventRegistration(eventId, attendeeId)
      if (res && res.success) {
        toast.success(res.data?.message || "Registration cancelled")
        await fetchData()
      } else {
        const data = res as any
        if (data?.requiresAttendeeSelection || data?.data?.requiresAttendeeSelection) {
          const attendees = extractCancellableAttendeesFromApiResponse(data)
          if (attendees.length > 0) {
            setAttendeeSelectList(attendees)
            setAttendeeSelectMode('cancel')
            setPendingRefundEventId(eventId)
            setAttendeeSelectOpen(true)
            return
          }
          const estimateRes = await apiClient.estimateRefund({ sourceType: "event_ticket", eventId })
          const estimate = estimateRes.success && estimateRes.data
            ? ((estimateRes.data as any)?.data ?? estimateRes.data)
            : null
          const estimateAttendees = estimate?.meta?.cancellableAttendees || []
          if (estimateAttendees.length > 0) {
            setAttendeeSelectList(estimateAttendees)
            setAttendeeSelectMode('cancel')
            setPendingRefundEventId(eventId)
            setAttendeeSelectOpen(true)
            return
          }
        }
        const msg = res?.error || res?.message || `Cancellation failed (status ${res?.status ?? "unknown"})`
        toast.error(msg)
      }
    } catch {
      toast.error("Failed to cancel registration")
    } finally {
      setCancellingEventId(null)
    }
  }

  const runRefundEstimate = async (eventId: string, attendeeId?: string) => {
    const res = await apiClient.estimateRefund({ sourceType: "event_ticket", eventId, attendeeId })
    if (res.success && res.data) {
      const rawData = res.data as any
      const estimate = rawData?.data != null ? rawData.data : rawData
      if (estimate.requiresAttendeeSelection) {
        const cancellable = estimate.meta?.cancellableAttendees || []
        if (cancellable.length > 0) {
          setAttendeeSelectList(cancellable)
          setAttendeeSelectMode('refund')
          setPendingRefundEventId(eventId)
          setAttendeeSelectOpen(true)
          return
        }
        toast.error("No cancellable tickets found for this registration")
        return
      }
      if (!estimate.eligible) {
        toast.error("Refund is not available for this ticket under the current policy")
        return
      }
      if (!estimate.breakdown?.grossPaid && estimate.estimatedRefund === 0) {
        await handleCancelRegistration(eventId, attendeeId || estimate.meta?.attendeeId)
        return
      }
      setRefundEstimate(estimate)
      setRefundCancelEventId(eventId)
      setRefundCancelAttendeeId(estimate.meta?.attendeeId || attendeeId || null)
    } else {
      const msg = (res as any).error || (res as any).message || "Failed to load refund estimate"
      toast.error(msg)
    }
  }

  const initiateRefundCancel = async (eventId: string, event?: Event) => {
    try {
      setRefundModalLoading(true)
      setRefundModalError(null)
      const isFree = event ? !isEventPaid(event) : false
      if (isFree) {
        await handleCancelRegistration(eventId)
        return
      }
      const policyRes = await apiClient.getEventRefundPolicy(eventId)
      const policy = policyRes.success && policyRes.data ? policyRes.data : null
      if (policy?.event_cancelled) {
        toast.info("This event was cancelled by the club. Automatic refund processing applies.")
        return
      }
      if (policy && policy.is_refund_allowed === false) {
        toast.error("Policy restriction", {
          description: "This ticket is non-refundable and cannot be cancelled for a refund.",
        })
        return
      }
      if (policy?.refund_window_closed) {
        toast.error("Refund window closed", {
          description: "The club's cancellation cut-off has passed for this event.",
        })
        return
      }
      await runRefundEstimate(eventId)
    } catch {
      toast.error("Failed to fetch refund estimate")
    } finally {
      setRefundModalLoading(false)
    }
  }

  const handleAttendeeSelected = async (attendeeId: string) => {
    const eventId = pendingRefundEventId
    if (!eventId) return
    setAttendeeSelectOpen(false)
    setPendingRefundEventId(null)
    if (attendeeSelectMode === 'cancel') {
      await handleCancelRegistration(eventId, attendeeId)
      return
    }
    try {
      setRefundModalLoading(true)
      await runRefundEstimate(eventId, attendeeId)
    } catch {
      toast.error("Failed to fetch refund estimate")
    } finally {
      setRefundModalLoading(false)
    }
  }

  const handleConfirmRefundCancel = async () => {
    if (!refundCancelEventId) return
    try {
      setRefundModalLoading(true)
      setRefundModalError(null)
      const res = await apiClient.requestRefund({
        sourceType: "event_ticket",
        eventId: refundCancelEventId,
        attendeeId: refundCancelAttendeeId || undefined,
      })
      if (res.success) {
        setRefundCancelEventId(null)
        setRefundCancelAttendeeId(null)
        setRefundEstimate(null)
        toast.success("Ticket cancelled. Refund will be processed in 5-7 working days.")
        await fetchData()
      } else {
        setRefundModalError((res as any).error || "Failed to request refund")
      }
    } catch {
      setRefundModalError("Failed to request refund")
    } finally {
      setRefundModalLoading(false)
    }
  }

  const getUserRegistrationForEvent = (event: Event) => {
    if (!user?._id) return null

    const registrationFromEvent = (event.registrations || []).find(
      (r: any) => String(r?.userId) === String(user._id) && r.status === "confirmed"
    )

    if (registrationFromEvent) {
      return registrationFromEvent
    }

    const registrationFromMap = userRegistrations.get(event._id)
    if (!registrationFromMap || registrationFromMap.status !== 'confirmed') {
      return null
    }
    return registrationFromMap
  }

  const isUserRegisteredForEvent = (event: Event) => isUserRegisteredOnEvent(event, user?._id)

  const getRegistrationStatusForEvent = (event: Event) =>
    getUserRegistrationStatus(event, user?._id)

  const handleReadMore = async (newsItem: News) => {
    try {
      const res = await apiClient.getPublicNewsById(newsItem._id)
      if (res.success && res.data) {
        setSelectedNewsForReadMore(res.data as News)
        setNews((prev) => (prev || []).map((n) => (n._id === newsItem._id ? (res.data as News) : n)))
      } else {
        setSelectedNewsForReadMore(newsItem)
      }
    } catch {
      setSelectedNewsForReadMore(newsItem)
    }
    setShowReadMoreModal(true)
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'date-short')
  }

  const formatTime = (dateString: string) => {
    return formatLocalDate(dateString, 'time-only')
  }

  const getAttendancePercentage = (current: number, max?: number) => {
    if (!max || max <= 0) return 0
    return Math.round((current / max) * 100)
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }
  const isEventFull = (event: Event) => {
    if (typeof event.maxAttendees !== "number" || event.maxAttendees <= 0) return false
    return (event.currentAttendees ?? 0) >= event.maxAttendees
  }

  const isEventPast = (event: Event) => {
    if (event.endTime) {
      return new Date(event.endTime) < new Date()
    }
    return new Date(event.startTime) < new Date()
  }

  const isEventOngoing = (event: Event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    if (event.endTime) {
      const end = new Date(event.endTime)
      return start <= now && now < end
    }
    return start <= now && now < new Date(start.getTime() + 4 * 60 * 60 * 1000)
  }

  const isEventUpcoming = (event: Event) => {
    return new Date(event.startTime) > new Date()
  }
  const renderActionButtons = (event: Event) => {
    const registered = isUserRegisteredForEvent(event)
    const registrationStatus = getRegistrationStatusForEvent(event)
    const eventFull = isEventFull(event)

    if (!user) {
      return (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.error("Please log in to register for events")}
        >
          Log in to register
        </Button>
      )
    }

    if (registered) {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleRegisterForEvent(event)}
            disabled={registrationStatus === 'confirmed'}
          >
            {registrationStatus === 'confirmed'
              ? "Registered"
              : "View registration"}
          </Button>
          <MemberTicketRefundAction
            eventId={event._id}
            eventIsActive={event.isActive !== false}
            isFreeEvent={!isEventPaid(event)}
            onRequestRefund={() => initiateRefundCancel(event._id, event)}
            loading={cancellingEventId === event._id || refundModalLoading}
          />
        </div>
      )
    }

    if (eventFull || !event.isActive || isEventPast(event)) {
      return (
        <Button variant="outline" className="w-full" disabled>
          {eventFull ? "Event full" : "Registration closed"}
        </Button>
      )
    }

    return (
      <Button
        className="w-full"
        onClick={() => handleRegisterForEvent(event)}
      >
        Register for event
      </Button>
    )
  }

  const upcomingEvents = useMemo(() => {
    return (events || [])
      .filter((event) => isEventUpcoming(event))
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
  }, [events])

  const pastEvents = useMemo(() => {
    return (events || [])
      .filter((event) => isEventPast(event))
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
  }, [events])

  const ongoingRegisteredEvents = useMemo(() => {
    if (!user) return [] as Event[]
    return (events || []).filter(
      (event) => isEventOngoing(event) && isUserRegisteredForEvent(event)
    )
  }, [events, user, userRegistrations])

  const renderEventCard = (event: Event) => {
    const registered = isUserRegisteredForEvent(event)
    const registrationStatus = getRegistrationStatusForEvent(event)
    const eventFull = isEventFull(event)

    return (
      <Card
        key={event._id}
        className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
      >
        <EventImage
          eventId={event._id}
          imageVersion={event.imageVersion}
          size="list"
          directUrl={eventVariantUrl(event, "list")}
          alt={event.title}
        />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {event.title}
              </CardTitle>
            </div>
            <div className="ml-2 flex-shrink-0 space-y-1 flex flex-col items-end">
              <Badge
                variant="secondary"
                className="capitalize"
              >
                {event.category?.replace("-", " ")}
              </Badge>
              <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
              {eventFull && (
                <Badge variant="destructive" className="text-xs uppercase">
                  Full
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 flex-1">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                Starts {formatDate(event.startTime)} at {formatTime(event.startTime)}
              </span>
            </div>
            {event.endTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  Ends {formatDate(event.endTime)} at {formatTime(event.endTime)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">
                {event.currentAttendees}
                {event.maxAttendees ? `/${event.maxAttendees}` : ""} attendees
              </span>
            </div>
          </div>

          {event.maxAttendees ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Capacity</span>
                <span>
                  {getAttendancePercentage(
                    event.currentAttendees || 0,
                    event.maxAttendees
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getAttendancePercentage(
                    event.currentAttendees || 0,
                    event.maxAttendees
                  ) >= 90
                      ? "bg-red-500"
                      : getAttendancePercentage(
                        event.currentAttendees || 0,
                        event.maxAttendees
                      ) >= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  style={{
                    width: `${Math.min(
                      getAttendancePercentage(
                        event.currentAttendees || 0,
                        event.maxAttendees
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <InfinityIcon className="h-3 w-3" />
              <span>Unlimited capacity</span>
            </div>
          )}

          <div className="pt-2 mt-auto">{renderActionButtons(event)}</div>
        </CardContent>
      </Card>
    )
  }

  const getPlanIcon = (planName?: string) => {
    if (!planName) return <Calendar className="w-4 h-4" />

    const lowerPlan = planName.toLowerCase()
    if (lowerPlan.includes('premium') || lowerPlan.includes('gold')) return <Crown className="w-4 h-4" />
    if (lowerPlan.includes('basic') || lowerPlan.includes('standard')) return <Shield className="w-4 h-4" />
    if (lowerPlan.includes('advanced') || lowerPlan.includes('pro')) return <Star className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-1000 ease-in-out pointer-events-none ${showLogo ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`relative w-32 h-32 md:w-40 md:h-40 transition-all duration-1000 ease-in-out ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {userClub?.logo ? (
                <Image
                  src={userClub.logo}
                  alt={userClub.name || "Club logo"}
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
          <div>
            <h1 className="text-3xl font-bold">Welcome, {getUserDisplayName()}!</h1>
            <p className="text-muted-foreground">Stay updated with the latest events and news from your supporter group</p>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(events || []).filter(e => !isEventPast(e)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Events you can attend
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest News</CardTitle>
                <Newspaper className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(news || []).length}</div>
                <p className="text-xs text-muted-foreground">
                  Published articles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Redeemable Points</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalPoints !== null ? totalPoints : '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalPoints !== null && onePointValue > 0 ? `${totalPoints} Points worth ${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'}${Number(totalPoints * onePointValue).toLocaleString()}` : 'Conversion not configured'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membership Status</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeMembership ? (
                    <div className="flex items-center gap-2">
                      {getPlanIcon(activeMembership.membership_level_id?.name || "")}
                      <span className="text-lg">{activeMembership.membership_level_id?.name || ""}</span>
                    </div>
                  ) : (
                    "No Active"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeMembership ? 'Active Membership' : 'No active membership'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Club Membership Status */}
          <MembershipStatus />

          {/* Upcoming Matches */}
          <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-4">
            <FixturesCards clubId={clubId ?? undefined} />
          </div>

          {/* League Table Widget */}
          {clubSettings?.sports?.teamId && clubSettings?.sports?.leagueId && (
            <div className="w-full rounded-[2.5rem] overflow-hidden border-2 shadow-xl bg-card p-4">
              <LeagueTableWidget leagueId={clubSettings.sports.leagueId} />
            </div>
          )}

          {/* Team League leaderboard is shown above when teamId and leagueId exist */}

          {/* Events and News Tabs - Only show if sections are visible */}
          {(isSectionVisible('events') || isSectionVisible('news')) && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                {isSectionVisible('events') && (
                  <TabsTrigger value="events">Events ({ongoingRegisteredEvents.length})</TabsTrigger>
                )}
                {isSectionVisible('news') && (
                  <TabsTrigger value="news">News & Updates ({news.filter(article => article.isPublished).length})</TabsTrigger>
                )}
              </TabsList>

              {isSectionVisible('events') && (
                <TabsContent value="events" className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading events...</p>
                      </div>
                    </div>
                  ) : (events || []).length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center space-y-2">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                          <h3 className="text-lg font-semibold">No events available</h3>
                          <p className="text-muted-foreground">
                            {userClub
                              ? "No events have been published for your club yet. Check back later for upcoming events."
                              : "You need to have an active club membership to view events."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-10">
                      {user && (
                        <section className="space-y-4">
                          <div>
                            <h4 className="text-md font-semibold">Ongoing events</h4>
                            <p className="text-sm text-muted-foreground">
                              Events you are registered for that are happening right now
                            </p>
                          </div>
                          {ongoingRegisteredEvents.length === 0 ? (
                            <Card>
                              <CardContent className="text-center py-6">
                                <p className="text-sm text-muted-foreground">
                                  No ongoing events that you're registered for right now.
                                </p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {ongoingRegisteredEvents.map((event) => (
                                <Card
                                  key={event._id}
                                  className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
                                >
                                  <EventImage
                                    eventId={event._id}
                                    imageVersion={event.imageVersion}
                                    size="list"
                                    directUrl={eventVariantUrl(event, "list")}
                                    alt={event.title}
                                  />
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg line-clamp-2">
                                          {event.title}
                                        </CardTitle>
                                      </div>
                                      <div className="ml-2 flex-shrink-0 space-y-1 flex flex-col items-end">
                                        <Badge variant="secondary" className="block capitalize">
                                          {event.category}
                                        </Badge>
                                        <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
                                        <AttendanceMarker event={event} userId={user?._id} />
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="flex flex-col gap-3 flex-1">
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          {formatDate(event.startTime)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>{formatTime(event.startTime)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span className="truncate">{event.venue}</span>
                                      </div>
                                    </div>
                                    <div className="pt-2 mt-auto">
                                      <Button
                                        onClick={() => {
                                          setSelectedEventForDetails(event)
                                          setShowEventDetailsModal(true)
                                        }}
                                        className="w-full"
                                      >
                                        View event
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </section>
                      )}

                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-semibold">Upcoming events</h2>
                          <Badge variant="outline">{upcomingEvents.length} events</Badge>
                        </div>
                        {upcomingEvents.length === 0 ? (
                          <Card>
                            <CardContent className="flex items-center justify-center h-48">
                              <div className="text-center space-y-2">
                                <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
                                <h3 className="text-lg font-semibold">No upcoming events</h3>
                                <p className="text-muted-foreground text-sm">
                                  Check back later for new events.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingEvents.map((event) => renderEventCard(event))}
                          </div>
                        )}
                      </section>

                      {pastEvents.length > 0 && (
                        <section className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">Past events</h2>
                            <Badge variant="outline">{pastEvents.length} events</Badge>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pastEvents.map((event) => (
                              <Card
                                key={event._id}
                                className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
                              >
                                <EventImage
                                  eventId={event._id}
                                  imageVersion={event.imageVersion}
                                  size="list"
                                  directUrl={eventVariantUrl(event, "list")}
                                  alt={event.title}
                                />
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                      <CardTitle className="text-lg line-clamp-2">
                                        {event.title}
                                      </CardTitle>
                                    </div>
                                    <div className="ml-2 flex-shrink-0 space-y-1 flex flex-col items-end">
                                      <Badge
                                        variant="secondary"
                                        className="capitalize"
                                      >
                                        {event.category?.replace("-", " ")}
                                      </Badge>
                                      <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3 flex-1">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {formatDate(event.startTime)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span>{formatTime(event.startTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      <span className="truncate">{event.venue}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-xs">
                                        {event.currentAttendees}
                                        {event.maxAttendees ? `/${event.maxAttendees}` : ""} attendees
                                      </span>
                                    </div>
                                  </div>
                                  {event.maxAttendees ? (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Capacity</span>
                                        <span>
                                          {getAttendancePercentage(
                                            event.currentAttendees || 0,
                                            event.maxAttendees
                                          )}
                                          %
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all ${getAttendancePercentage(
                                            event.currentAttendees || 0,
                                            event.maxAttendees
                                          ) >= 90
                                              ? "bg-red-500"
                                              : getAttendancePercentage(
                                                event.currentAttendees || 0,
                                                event.maxAttendees
                                              ) >= 75
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                            }`}
                                          style={{
                                            width: `${Math.min(
                                              getAttendancePercentage(
                                                event.currentAttendees || 0,
                                                event.maxAttendees
                                              ),
                                              100
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <InfinityIcon className="h-3 w-3" />
                                      <span>Unlimited capacity</span>
                                    </div>
                                  )}
                                  <div className="pt-2 mt-auto">
                                    <Button variant="outline" className="w-full" disabled>
                                      Event ended
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </TabsContent>
              )}

              {isSectionVisible('news') && (
                <TabsContent value="news" className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading news...</p>
                      </div>
                    </div>
                  ) : (news || []).length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">No news available</h3>
                          <p className="text-muted-foreground">
                            {userClub ?
                              "No news articles have been published for your club yet. Check back later for updates." :
                              "You need to have an active club membership to view news articles."
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {/* News Summary */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Latest News & Updates</h3>
                          <p className="text-sm text-muted-foreground">
                            {news.filter(article => article.isPublished).length} published articles
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {userClub?.name || 'Your Club'}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {(() => {
                          const publishedNews = (news || []).filter(article => article.isPublished)
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 6); 

                          return publishedNews.map((article) => (
                            <Card key={article._id} className="hover:shadow-md transition-shadow">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <UserIcon className="w-3 h-3" />
                                        {article.author}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(article.createdAt)}
                                      </span>
                                      {article.category && (
                                        <Badge variant="secondary" className="text-xs">
                                          {article.category}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                                    {article.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <p className="text-muted-foreground leading-relaxed">
                                    {truncateText(article.content, 250)}
                                  </p>

                                  {article.tags && article.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {article.tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          <Tag className="w-3 h-3 mr-1" />
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  <div className="pt-2 border-t">
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => handleReadMore(article)}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Read Full Article
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        })()}
                      </div>

                      {/* Show More News Button */}
                      {news.filter(article => article.isPublished).length > 6 && (
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => window.location.href = "/dashboard/user/news"}
                            className="px-8"
                          >
                            <Newspaper className="w-4 h-4 mr-2" />
                            View All News Articles
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* Polls Widget - Only show if visible */}
          {userClub && isSectionVisible('polls') && (
            <PollsWidget limit={3} showCreateButton={false} />
          )}
        </div>

        {/* Read More News Modal */}
        <NewsReadMoreModal
          news={selectedNewsForReadMore}
          isOpen={showReadMoreModal}
          onClose={() => {
            setShowReadMoreModal(false)
            setSelectedNewsForReadMore(null)
          }}
        />
        <EventDetailsModal
          event={selectedEventForDetails}
          isOpen={showEventDetailsModal}
          onClose={() => { setShowEventDetailsModal(false); setSelectedEventForDetails(null) }}
        />
        <VenueTierCartModal
          isOpen={showVenueTierCartModal}
          onClose={() => { setShowVenueTierCartModal(false); setVenueTierEvent(null) }}
          event={venueTierEvent}
          onSuccess={() => {
            setShowVenueTierCartModal(false)
            setVenueTierEvent(null)
            fetchData()
          }}
          onFailure={() => {
            setShowVenueTierCartModal(false)
          }}
        />
        {refundCancelEventId && refundEstimate && (
          <RefundConfirmationModal
            estimate={refundEstimate}
            sourceType="event_ticket"
            loading={refundModalLoading}
            error={refundModalError}
            onConfirm={handleConfirmRefundCancel}
            onCancel={() => {
              setRefundCancelEventId(null)
              setRefundCancelAttendeeId(null)
              setRefundEstimate(null)
              setRefundModalError(null)
            }}
          />
        )}
        <AttendeeTicketSelectModal
          open={attendeeSelectOpen}
          attendees={attendeeSelectList}
          loading={refundModalLoading || cancellingEventId !== null}
          title={attendeeSelectMode === 'refund' ? 'Select ticket to refund' : 'Select ticket to cancel'}
          description="Choose which attendee ticket to cancel. Your other tickets for this event will stay active."
          onSelect={handleAttendeeSelected}
          onCancel={() => {
            setAttendeeSelectOpen(false)
            setPendingRefundEventId(null)
            setAttendeeSelectList([])
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}