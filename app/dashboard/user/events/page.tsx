"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient, Event } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, MapPin, Clock, Users, Search, Filter, Eye, Infinity as InfinityIcon } from "lucide-react"
import EventDetailsModal from '@/components/modals/event-details-modal'

const eventCategories = [
  "all",
  "general",
  "sports",
  "music",
  "business",
  "education",
  "community",
  "charity",
  "technology",
  "health",
  "entertainment"
]

export default function UserEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPublicEvents()

      if (response.success && response.data) {
        setEvents(response.data)
      } else {
        console.error("Failed to fetch events:", response.error)
        toast.error("Failed to fetch events")
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Error fetching events")
    } finally {
      setLoading(false)
    }
  }

  const handleEventRegistration = async (eventId: string) => {
    if (!user) {
      toast.error("Please log in to register for events")
      return
    }

    try {
      const response = await apiClient.registerForEvent(eventId, user._id)
      if (response.success) {
        toast.success("Successfully registered for event!")
        fetchEvents() // Refresh events to update attendance
      } else {
        toast.error(response.error || "Failed to register for event")
      }
    } catch (error) {
      console.error("Error registering for event:", error)
      toast.error("Error registering for event")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAttendancePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const isEventFull = (event: Event) => {
    return event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false
  }

  const isEventPast = (event: Event) => {
    return new Date(event.startTime) < new Date()
  }

  const isEventOngoing = (event: Event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    const end = event.endTime ? new Date(event.endTime) : null
    if (end) {
      return start <= now && now < end
    }
    // If no end time, consider ongoing if startTime is in the past and it's not marked as past by existing logic
    return start <= now && !isEventPast(event)
  }

  const eventsUserIsRegisteredForOngoing = () => {
    if (!user) return [] as Event[]
    return (events || []).filter(ev => {
      const regs = ev.registrations || []
      const found = regs.find((r: any) => r.userId === user._id)
      return !!found && isEventOngoing(ev)
    })
  }

  const filteredEvents = events.filter(event => {
    // Apply search filter
    const searchMatch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase())

    // Apply category filter
    const categoryMatch = categoryFilter === "all" || event.category === categoryFilter

    return searchMatch && categoryMatch
  })

  const upcomingEvents = filteredEvents.filter(event => !isEventPast(event))
  const pastEvents = filteredEvents.filter(event => isEventPast(event))

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">Discover and register for upcoming events</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
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
                    {eventCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <div className="space-y-4">
            {/* Ongoing events the user has registered for (inside Upcoming section) */}
            <div className="mt-4">
              <h4 className="text-md font-semibold">Ongoing events</h4>
              <p className="text-sm text-muted-foreground mb-3">Ongoing events that you've registered for</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsUserIsRegisteredForOngoing().length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No ongoing events that you're registered for right now.</p>
                    </CardContent>
                  </Card>
                ) : (
                  eventsUserIsRegisteredForOngoing().map(event => (
                    <Card key={event._id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                          </div>
                          <Badge variant={event.isActive ? "default" : "secondary"} className="ml-2 flex-shrink-0">{event.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{formatDate(event.startTime)}</span></div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="truncate">{event.venue}</span></div>
                        </div>
                        <div className="pt-2">
                          <Button onClick={() => { setSelectedEventForDetails(event); setShowEventDetailsModal(true) }} className="w-full">View event</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Upcoming Events</h2>
              <Badge variant="outline">{upcomingEvents.length} events</Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading events...</p>
                </div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No upcoming events</h3>
                    <p className="text-muted-foreground">Check back later for new events</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((event) => (
                  <Card key={event._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={event.isActive ? "default" : "secondary"}
                          className="ml-2 flex-shrink-0"
                        >
                          {event.category}
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
                          <span>{new Date(event.startTime).toLocaleTimeString('en-US')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">
                            {event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attendees
                          </span>
                        </div>
                      </div>
                      
                      {/* Attendance Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Capacity</span>
                          {event.maxAttendees && (
                            <span>{getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees)}%</span>
                          )}
                        </div>
                        {event.maxAttendees ? (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees) >= 90 
                                  ? 'bg-red-500' 
                                  : getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees) >= 75 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min(getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees), 100)}%` 
                              }}
                            ></div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <InfinityIcon className="h-3 w-3" />
                            <span>Unlimited capacity</span>
                          </div>
                        )}
                      </div>
                      
                          <div className="pt-2">
                        {event.maxAttendees && isEventFull(event) ? (
                          <Button disabled className="w-full" variant="secondary">
                            Event Full
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleEventRegistration(event._id)}
                            className="w-full"
                          >
                            Register for Event
                          </Button>
                        )}
                      </div>
                        
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Past Events</h2>
                <Badge variant="outline">{pastEvents.length} events</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((event) => (
                  <Card key={event._id} className="overflow-hidden opacity-75 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {event.category}
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
                          <span>{new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">
                            {event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attendees
                          </span>
                        </div>
                      </div>
                      
                      {/* Attendance Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Capacity</span>
                          {event.maxAttendees && (
                            <span>{getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees)}%</span>
                          )}
                        </div>
                        {event.maxAttendees ? (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees) >= 90 
                                  ? 'bg-red-500' 
                                  : getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees) >= 75 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min(getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees), 100)}%` 
                              }}
                            ></div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <InfinityIcon className="h-3 w-3" />
                            <span>Unlimited capacity</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="outline" className="w-full" disabled>
                          Event Ended
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
      <EventDetailsModal
        event={selectedEventForDetails}
        isOpen={showEventDetailsModal}
        onClose={() => { setShowEventDetailsModal(false); setSelectedEventForDetails(null) }}
      />
    </ProtectedRoute>
  )
} 