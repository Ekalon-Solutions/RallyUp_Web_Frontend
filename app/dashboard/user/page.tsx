"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { formatLocalDate } from "@/lib/timezone"
import { Calendar, MapPin, Clock, Users, Newspaper, Tag, User as UserIcon, Eye, CreditCard, Crown, Star, Shield, Infinity as InfinityIcon, Trash } from "lucide-react"
import EventDetailsModal from '@/components/modals/event-details-modal'
import UserEventRegistrationModal from "@/components/modals/user-event-registration-modal"
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal"
import { EventPaymentSimulationModal } from "@/components/modals/event-payment-simulation-modal"

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
import { useClubSettings } from "@/hooks/useClubSettings"

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")
  const [showReadMoreModal, setShowReadMoreModal] = useState(false)
  const [selectedNewsForReadMore, setSelectedNewsForReadMore] = useState<News | null>(null)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map())
  const [registrationEventId, setRegistrationEventId] = useState<string | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null)
  const [showEventCheckoutModal, setShowEventCheckoutModal] = useState(false)
  const [showEventPaymentSimulationModal, setShowEventPaymentSimulationModal] = useState(false)
  const [eventForPayment, setEventForPayment] = useState<Event | null>(null)
  const [attendeesForPayment, setAttendeesForPayment] = useState<any[]>([])

  const paymentEvent = eventForPayment
    ? {
        _id: eventForPayment._id,
        name: eventForPayment.title,
        price: eventForPayment.ticketPrice ?? 0,
        ticketPrice: eventForPayment.ticketPrice,
        earlyBirdDiscount: eventForPayment.earlyBirdDiscount,
        currency: (eventForPayment as any)?.currency,
      }
    : undefined

  console.log("user:", user)
  // Get user's active club membership
  const getActiveMembership = () => {
    if (!user || user.role === 'system_owner') return null;

    const userMemberships = (user as User | Admin).memberships || [];
    return userMemberships.find(m => m.status === 'active');
  }

  const activeMembership = getActiveMembership();
  const userClub = activeMembership?.club_id;

  // Load club settings to check section visibility
  const { isSectionVisible } = useClubSettings(userClub?._id)

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'Member';

    // Try to get name from different possible sources
    if (user.name) {
      return user.name;
    }

    // Check if we have first_name and last_name
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
    // console.log('User dashboard - User object:', user)
    // console.log('Active membership:', activeMembership)
    // console.log('User club:', userClub)
    fetchData()
  }, [user, activeMembership, userClub])

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

      // Check if user has an active club membership
      if (!activeMembership || !userClub) {
        // console.log('User has no active club membership:', { activeMembership, userClub })
        toast.error("You need to have an active club membership to view news and events")
        setLoading(false)
        return
      }

      // console.log('User club:', userClub)
      // console.log('User club ID:', userClub._id)

      // Fetch public events and club-specific news
      const [eventsResponse, newsResponse] = await Promise.all([
        apiClient.getPublicEvents(),
        apiClient.getNewsByUserClub()
      ])

      if (eventsResponse.success && eventsResponse.data) {
        const eventsData = Array.isArray(eventsResponse.data) ? eventsResponse.data : (eventsResponse.data as any).events || []
        setEvents(eventsData)
      }

      if (user) {
        await fetchUserRegistrations()
      } else {
        setUserRegistrations(new Map())
      }

      if (newsResponse.success && newsResponse.data) {
        // console.log('News response:', newsResponse)
        // console.log('News data:', newsResponse.data)
        const newsData = Array.isArray(newsResponse.data) ? newsResponse.data : (newsResponse.data as any).news || []
        // console.log('News array:', newsData)
        setNews(newsData)
      } else {
        // console.error('News response failed:', newsResponse)
        // console.error('News error details:', newsResponse.error)
      }
    } catch (error) {
      // console.error("Error fetching data:", error)
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
      // console.error("Error fetching user registrations:", error)
    }
  }

  const handleRegisterForEvent = (event: Event) => {
    if (!user) {
      toast.error("Please log in to register for events")
      return
    }
    setRegistrationEventId(event._id)
    setShowRegistrationModal(true)
  }

  const handlePerformRegistration = async (payload: {
    eventId: string;
    attendees: any[];
  }) => {
    if (!payload || !payload.eventId) return
    const event = events.find((e) => e._id === payload.eventId);
    if (event?.ticketPrice) {
      // Open EventCheckoutModal for paid events
      setShowEventCheckoutModal(true);
      setEventForPayment({ ...event, price: event.ticketPrice } as Event & {
        price: number;
      });
      setAttendeesForPayment(
        payload.attendees
      );
      return;
    }
    try {
      const registrationPromise = (async () => {
        const res = await apiClient.registerForEvent(
          payload.eventId,
          undefined,
          payload.attendees
        )
        if (!res || !res.success) throw res ?? new Error("Registration failed")
        return res
      })()

      toast.promise(registrationPromise, {
        loading: "Registering...",
        success: (res: any) => {
          fetchData()
          setShowRegistrationModal(false)
          setRegistrationEventId(null)
          return res?.data?.message || "Registered successfully"
        },
        error: (err: any) => {
          const msg = err?.error || err?.message || err?.data?.message || "Registration failed"
          return msg
        },
      })
    } catch (error) {
      // console.error("Registration API error", error)
      toast.error("Failed to register for event")
    }
  }

  const handleCancelRegistration = async (eventId: string) => {
    if (!eventId) return
    if (!window.confirm("Are you sure you want to cancel your registration for this event?")) {
      return
    }
    try {
      setCancellingEventId(eventId)
      const res = await apiClient.cancelEventRegistration(eventId)
      if (res && res.success) {
        toast.success(res.data?.message || "Registration cancelled")
        await fetchData()
      } else {
        const msg = res?.error || res?.message || `Cancellation failed (status ${res?.status ?? "unknown"})`
        toast.error(msg)
        // console.error('Cancel registration failed:', res)
      }
    } catch (error) {
      // console.error("Cancel registration error", error)
      toast.error("Failed to cancel registration")
    } finally {
      setCancellingEventId(null)
    }
  }

  const getUserRegistrationForEvent = (event: Event) => {
    if (!user?._id) return null

    const registrationFromEvent = (event.registrations || []).find(
      (r: any) => String(r?.userId) === String(user._id)
    )

    if (registrationFromEvent) {
      return registrationFromEvent
    }

    const registrationFromMap = userRegistrations.get(event._id)
    return registrationFromMap || null
  }

  const isUserRegisteredForEvent = (event: Event) => {
    const registration = getUserRegistrationForEvent(event)
    if (!registration) return false
    return registration.status ? registration.status !== "cancelled" : true
  }

  const getRegistrationStatusForEvent = (event: Event) => {
    const registration = getUserRegistrationForEvent(event)
    return registration?.status ?? null
  }

  const handleReadMore = (newsItem: News) => {
    setSelectedNewsForReadMore(newsItem)
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
          <Button
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleCancelRegistration(event._id)
            }}
            disabled={cancellingEventId === event._id}
            className="h-10 w-10 p-0 flex items-center justify-center"
            title="Cancel registration"
          >
            <Trash className="w-4 h-4" />
          </Button>
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
        className="overflow-hidden hover:shadow-md transition-shadow"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {event.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </div>
            <div className="ml-2 flex-shrink-0 space-y-1 text-right">
              <Badge
                variant="secondary"
                className="capitalize"
              >
                {event.category?.replace("-", " ")}
              </Badge>
              {eventFull && (
                <Badge variant="destructive" className="text-xs uppercase">
                  Full
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="pt-2">{renderActionButtons(event)}</div>
        </CardContent>
      </Card>
    )
  }


  // Get membership plan icon
  const getPlanIcon = (planName?: string) => {
    if (!planName) return <Calendar className="w-4 h-4" />

    const lowerPlan = planName.toLowerCase()
    if (lowerPlan.includes('premium') || lowerPlan.includes('gold')) return <Crown className="w-4 h-4" />
    if (lowerPlan.includes('basic') || lowerPlan.includes('standard')) return <Shield className="w-4 h-4" />
    if (lowerPlan.includes('advanced') || lowerPlan.includes('pro')) return <Star className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }

  const handleEventPayment = (event: Event, attendees: any[]) => {
    setEventForPayment(event);
    setAttendeesForPayment(attendees);
    setShowEventCheckoutModal(true);
  };

  const handleEventCheckoutSuccess = () => {
    setShowEventCheckoutModal(false);
    setShowEventPaymentSimulationModal(true);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {getUserDisplayName()}!</h1>
            <p className="text-muted-foreground">Stay updated with the latest events and news from your supporter group</p>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-3">
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
                                  className="overflow-hidden hover:shadow-md transition-shadow"
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg line-clamp-2">
                                          {event.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                          {event.description}
                                        </CardDescription>
                                      </div>
                                      <div className="ml-2 flex-shrink-0 space-y-1">
                                        <Badge variant="secondary" className="block capitalize">
                                          {event.category}
                                        </Badge>
                                        <AttendanceMarker event={event} userId={user?._id} />
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
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
                                    <div className="pt-2">
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
                                className="overflow-hidden hover:shadow-md transition-shadow"
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                      <CardTitle className="text-lg line-clamp-2">
                                        {event.title}
                                      </CardTitle>
                                      <CardDescription className="line-clamp-2">
                                        {event.description}
                                      </CardDescription>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="capitalize ml-2 flex-shrink-0"
                                    >
                                      {event.category?.replace("-", " ")}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
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
                                  <div className="pt-2">
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

                      {/* News Articles */}
                      <div className="space-y-4">
                        {(() => {
                          const publishedNews = (news || []).filter(article => article.isPublished)
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 6); // Show only latest 6 articles

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
        <UserEventRegistrationModal
          eventId={registrationEventId}
          isOpen={showRegistrationModal}
          onClose={() => {
            setShowRegistrationModal(false)
            setRegistrationEventId(null)
          }}
          onRegister={handlePerformRegistration}
        />
        {paymentEvent && (
          <EventCheckoutModal
            isOpen={showEventCheckoutModal}
            onClose={() => setShowEventCheckoutModal(false)}
            event={paymentEvent}
            attendees={attendeesForPayment}
            onSuccess={handleEventCheckoutSuccess}
            onFailure={() => setShowEventCheckoutModal(false)}
          />
        )}

        {paymentEvent && (
          <EventPaymentSimulationModal
            isOpen={showEventPaymentSimulationModal}
            onClose={() => setShowEventPaymentSimulationModal(false)}
            event={paymentEvent}
            attendees={attendeesForPayment}
            onPaymentSuccess={() => {
              setShowEventPaymentSimulationModal(false);
              fetchData();
              toast.success("Payment successful!");
            }}
            onPaymentFailure={() => {
              setShowEventPaymentSimulationModal(false);
              toast.error("Payment failed. Please try again.");
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}