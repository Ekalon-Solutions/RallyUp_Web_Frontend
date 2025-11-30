"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, MapPin, Clock, Users, Ticket, UserCheck, Bus, Filter } from "lucide-react"
import { EventRegistrationModal } from "@/components/modals/event-registration-modal"
import { apiClient, Event } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function PublicEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map())

  // Registration modal states
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
    if (user) {
      fetchUserRegistrations()
    }
  }, [searchTerm, categoryFilter, user])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPublicEvents()

      if (response.success && response.data) {
        let filteredEvents = response.data.filter(event => event.isActive)

        // Apply search filter
        if (searchTerm) {
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venue.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Apply category filter
        if (categoryFilter !== "all") {
          filteredEvents = filteredEvents.filter(event => event.category === categoryFilter)
        }

        setEvents(filteredEvents)
      } else {
        // console.error("Failed to fetch events:", response.error)
        toast.error("Failed to fetch events")
      }
    } catch (error) {
      // console.error("Error fetching events:", error)
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
      // console.error("Error fetching user registrations:", error)
    }
  }

  const handleRegisterForEvent = (event: Event) => {
    if (!user) {
      toast.error("Please log in to register for events")
      return
    }
    setSelectedEvent(event)
    setRegistrationModalOpen(true)
  }

  const handleRegistrationSuccess = () => {
    fetchEvents()
    if (user) {
      fetchUserRegistrations()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'match-screening': return '📺'
      case 'away-day': return '🚌'
      case 'social': return '🎉'
      case 'fundraising': return '💰'
      case 'meeting': return '🤝'
      case 'community-outreach': return '🌍'
      default: return '📅'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match-screening': return 'bg-blue-100 text-blue-800'
      case 'away-day': return 'bg-green-100 text-green-800'
      case 'social': return 'bg-purple-100 text-purple-800'
      case 'fundraising': return 'bg-yellow-100 text-yellow-800'
      case 'meeting': return 'bg-gray-100 text-gray-800'
      case 'community-outreach': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.has(eventId)
  }

  const getRegistrationStatus = (eventId: string) => {
    const registration = userRegistrations.get(eventId)
    return registration ? registration.status : null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Upcoming Events</h1>
            <p className="text-xl text-muted-foreground">
              Join exciting events with your supporter group
            </p>
          </div>

          {/* Event Registration Modal */}
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

          {/* Filters and Search */}
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
                    <SelectItem value="match-screening">Match Screening</SelectItem>
                    <SelectItem value="away-day">Away Day Travel</SelectItem>
                    <SelectItem value="social">Social Event</SelectItem>
                    <SelectItem value="fundraising">Fundraising</SelectItem>
                    <SelectItem value="meeting">Club Meeting</SelectItem>
                    <SelectItem value="community-outreach">Community Outreach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Events Grid */}
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
                    const isEventFull = event.maxAttendees && event.currentAttendees >= event.maxAttendees
                    const canRegister = event.isActive && !isEventFull && !isRegistered

                    return (
                      <Card key={event._id} className="overflow-hidden">
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
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
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
                              <span className="line-clamp-1">{event.venue}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {event.currentAttendees}
                                {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attendees
                                {isEventFull && <span className="text-red-600 font-medium"> (FULL)</span>}
                              </span>
                            </div>
                            
                            {event.ticketPrice > 0 && (
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-muted-foreground" />
                                <span>₹{event.ticketPrice}</span>
                              </div>
                            )}
                            
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
                          </div>

                          {/* Action Button */}
                          <div className="pt-2">
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
                                Register for Event
                              </Button>
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
