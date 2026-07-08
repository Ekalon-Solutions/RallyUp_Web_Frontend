"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, MapPin, Clock, Users, Ticket, UserCheck, Bus, Filter } from "lucide-react"
import { EventRegistrationModal } from "@/components/modals/event-registration-modal"
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal"
import { apiClient, Event } from "@/lib/api"
import { EventImage } from "@/components/events/event-image"
import { eventVariantUrl } from "@/lib/eventImageCache"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { formatLocalDate } from "@/lib/timezone"
import { isUserRegisteredForEvent as isUserRegisteredOnEvent, getUserRegistrationStatus } from "@/lib/event-registration"
import { JointScreeningDisplay } from "@/components/events/joint-screening-display"
import { EventScheduleMeta } from "@/components/events/event-schedule-meta"
import { WaitlistDisplay } from "@/components/events/waitlist-display"
import {
  formatEventPriceDisplay,
  getEventCapacity,
  getEventVenueDisplay,
  hasVenueTierMatrix,
  isEventPaid,
} from "@/lib/event-display-price"

export default function PublicEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map())
  const [waitlistStatus, setWaitlistStatus] = useState<Map<string, { position: number; status: string }>>(new Map())
  const [joiningWaitlistId, setJoiningWaitlistId] = useState<string | null>(null)

  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showVenueTierCartModal, setShowVenueTierCartModal] = useState(false)
  const [venueTierEvent, setVenueTierEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
    if (user) {
      fetchUserRegistrations()
      apiClient.getMyWaitlistStatus().then((r) => {
        if (r.success && r.data) {
          const m = new Map()
          r.data.forEach((w: any) => m.set(String(w.eventId), { position: w.position, status: w.status }))
          setWaitlistStatus(m)
        }
      })
    }
  }, [searchTerm, categoryFilter, user])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPublicEvents()

      if (response.success && response.data) {
        let filteredEvents = response.data.filter(event => event.isActive)

        if (searchTerm) {
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venue.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        if (categoryFilter !== "all") {
          filteredEvents = filteredEvents.filter(event => event.category === categoryFilter)
        }

        setEvents(filteredEvents)
      } else {
        toast.error("Failed to fetch events")
      }
    } catch (error) {
      toast.error("Error fetching events")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRegistrations = async () => {
    try {
      const response = await apiClient.getUserEventRegistrations()
      if (response.success && response.data) {
        const registrationsMap = new Map()
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

    if (hasVenueTierMatrix(event)) {
      setVenueTierEvent(event)
      setShowVenueTierCartModal(true)
      return
    }

    setSelectedEvent(event)
    setRegistrationModalOpen(true)
  }

  const handleRegistrationSuccess = () => {
    fetchEvents()
    if (user) {
      fetchUserRegistrations()
      apiClient.getMyWaitlistStatus().then((r) => {
        if (r.success && r.data) {
          const m = new Map()
          r.data.forEach((w: any) => m.set(String(w.eventId), { position: w.position, status: w.status }))
          setWaitlistStatus(m)
        }
      })
    }
  }

  const handleJoinWaitlist = async (eventId: string) => {
    try {
      setJoiningWaitlistId(eventId)
      const res = await apiClient.joinWaitlist(eventId)
      if (res.success) {
        toast.success(`Joined waitlist at position ${res.data?.position || 1}`)
        handleRegistrationSuccess()
      } else {
        toast.error(res.error || res.message || "Failed to join waitlist")
      }
    } catch {
      toast.error("Failed to join waitlist")
    } finally {
      setJoiningWaitlistId(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatLocalDate(dateString, 'long')
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'screenings': return '📺'
      case 'footy-meets': return '⚽'
      case 'tournaments': return '🏆'
      case 'auctions': return '🔨'
      case 'club-events': return '🎪'
      case 'social-events': return '🎉'
      case 'csr-events': return '🤝'
      case 'watch-parties': return '📺'
      case 'travel-days': return '🚌'
      case 'workshops': return '🎓'
      case 'general-meeting': return '👥'
      case 'matchday': return '⚽'
      case 'others': return '📅'
      default: return '📅'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'screenings': return 'bg-blue-100 text-blue-800'
      case 'footy-meets': return 'bg-green-100 text-green-800'
      case 'tournaments': return 'bg-yellow-100 text-yellow-800'
      case 'auctions': return 'bg-orange-100 text-orange-800'
      case 'club-events': return 'bg-purple-100 text-purple-800'
      case 'social-events': return 'bg-pink-100 text-pink-800'
      case 'csr-events': return 'bg-teal-100 text-teal-800'
      case 'watch-parties': return 'bg-indigo-100 text-indigo-800'
      case 'travel-days': return 'bg-emerald-100 text-emerald-800'
      case 'workshops': return 'bg-amber-100 text-amber-800'
      case 'general-meeting': return 'bg-gray-100 text-gray-800'
      case 'matchday': return 'bg-red-100 text-red-800'
      case 'others': return 'bg-slate-100 text-slate-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCapacity = (event: Event): { count: number; max: number | null } => {
    return getEventCapacity(event)
  }

  const isUserRegistered = (eventId: string) => {
    const registration = userRegistrations.get(eventId)
    if (registration) {
      if (registration.status === 'pending') return true
      if (registration.status === 'confirmed') {
        if (typeof registration.activeTicketCount === 'number') {
          return registration.activeTicketCount > 0
        }
        return true
      }
    }
    const event = events.find((e) => e._id === eventId)
    return event ? isUserRegisteredOnEvent(event, user?._id, userRegistrations) : false
  }

  const getRegistrationStatus = (eventId: string) => {
    const registration = userRegistrations.get(eventId)
    if (registration) return registration.status
    const event = events.find((e) => e._id === eventId)
    return event ? getUserRegistrationStatus(event, user?._id) : null
  }

  return (
    <div className="min-h-screen bg-background public-theme">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Upcoming Events</h1>
            <p className="text-xl text-muted-foreground">
              Join exciting events with your supporter group
            </p>
          </div>

          <EventRegistrationModal
            isOpen={registrationModalOpen}
            onClose={() => {
              setRegistrationModalOpen(false)
              setSelectedEvent(null)
            }}
            onSuccess={handleRegistrationSuccess}
            event={selectedEvent}
            isRegistered={selectedEvent ? isUserRegistered(selectedEvent._id) : false}
            registrationStatus={selectedEvent ? getRegistrationStatus(selectedEvent._id) : undefined}
          />

          <VenueTierCartModal
            isOpen={showVenueTierCartModal}
            onClose={() => { setShowVenueTierCartModal(false); setVenueTierEvent(null) }}
            event={venueTierEvent}
            onSuccess={() => {
              setShowVenueTierCartModal(false)
              setVenueTierEvent(null)
              handleRegistrationSuccess()
            }}
            onFailure={() => {
              setShowVenueTierCartModal(false)
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Find Events</CardTitle>
              <CardDescription>Search and filter available events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="screenings">📺 Screenings</SelectItem>
                    <SelectItem value="footy-meets">⚽ Footy Meets</SelectItem>
                    <SelectItem value="tournaments">🏆 Tournaments</SelectItem>
                    <SelectItem value="auctions">🔨 Auctions</SelectItem>
                    <SelectItem value="club-events">🎪 Club Events</SelectItem>
                    <SelectItem value="social-events">🎉 Social Events</SelectItem>
                    <SelectItem value="csr-events">🤝 CSR Events</SelectItem>
                    <SelectItem value="watch-parties">📺 Watch Parties</SelectItem>
                    <SelectItem value="travel-days">🚌 Travel Days</SelectItem>
                    <SelectItem value="workshops">🎓 Workshops</SelectItem>
                    <SelectItem value="general-meeting">👥 General Meeting</SelectItem>
                    <SelectItem value="matchday">⚽ Matchday</SelectItem>
                    <SelectItem value="others">📅 Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || categoryFilter !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Check back later for upcoming events"
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => {
                    const isRegistered = isUserRegistered(event._id)
                    const hasVenues = hasVenueTierMatrix(event)
                    const { count: capacityCount, max: capacityMax } = getCapacity(event)
                    const isEventFull = capacityMax !== null ? capacityCount >= capacityMax : false
                    const canRegister = event.isActive && !isEventFull && !isRegistered

                    return (
                      <Card key={event._id} className="overflow-hidden flex flex-col h-full">
                        <EventImage
                          eventId={event._id}
                          imageVersion={event.imageVersion}
                          size="list"
                          directUrl={eventVariantUrl(event, "list")}
                          alt={event.title}
                        />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <Badge className={getCategoryColor(event.category)}>
                              {getCategoryIcon(event.category)} {event.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            {isRegistered && (
                              <Badge variant="outline" className="text-green-700 border-green-300">
                                Registered
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                        </CardHeader>
                        
                        <CardContent className="flex flex-col gap-4 flex-1">
                          {/* Event Details */}
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{formatDate(event.startTime)}</span>
                            </div>
                            
                            {event.endTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>Ends: {formatDate(event.endTime)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="line-clamp-1">{getEventVenueDisplay(event)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {capacityCount}
                                {capacityMax !== null ? ` / ${capacityMax}` : ''} attendees
                                {isEventFull && <span className="text-red-600 font-medium"> (FULL)</span>}
                              </span>
                            </div>
                            
                            {isEventPaid(event) && (() => {
                              const priceLabel = formatEventPriceDisplay(event, { fromPrefix: hasVenues })
                              return priceLabel ? (
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-primary">
                                    {priceLabel}
                                  </span>
                                  {hasVenues && (
                                    <Badge variant="outline" className="text-xs">Multi-venue</Badge>
                                  )}
                                </div>
                              ) : null
                            })()}
                            
                            {event.memberOnly && (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-muted-foreground" />
                                <span className="text-blue-600 text-xs">Members only</span>
                              </div>
                            )}
                            
                            {event.awayDayEvent && (
                              <div className="flex items-center gap-2">
                                <Bus className="w-4 h-4 text-muted-foreground" />
                                <span className="text-green-600 text-xs">Away day travel</span>
                              </div>
                            )}

                            <JointScreeningDisplay jointScreening={event.jointScreening} variant="badge" />
                            <WaitlistDisplay waitlist={event.waitlist} variant="badge" />

                            <EventScheduleMeta
                              bookingStartTime={event.bookingStartTime}
                              bookingEndTime={event.bookingEndTime}
                              attendancePoints={event.attendancePoints}
                            />
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 mt-auto">
                            {!user ? (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => toast.error("Please log in to register for events")}
                              >
                                Log in to Register
                              </Button>
                            ) : isRegistered ? (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleRegisterForEvent(event)}
                              >
                                View Registration
                              </Button>
                            ) : canRegister ? (
                              <Button 
                                className="w-full"
                                onClick={() => handleRegisterForEvent(event)}
                              >
                                {event.category === 'csr-events' ? 'Donate for Event' : 'Register for Event'}
                              </Button>
                            ) : isEventFull && (event as any).waitlist?.enabled ? (
                              waitlistStatus.has(event._id) ? (
                                <Button variant="outline" className="w-full" disabled>
                                  On Waitlist (Position: {waitlistStatus.get(event._id)?.position ?? 1})
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => handleJoinWaitlist(event._id)}
                                  disabled={joiningWaitlistId === event._id}
                                >
                                  {joiningWaitlistId === event._id ? "Joining..." : "Join Waitlist"}
                                </Button>
                              )
                            ) : (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                disabled
                              >
                                {isEventFull ? "Event Full" : "Registration Closed"}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
