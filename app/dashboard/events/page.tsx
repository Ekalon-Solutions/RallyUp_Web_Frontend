"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, MoreHorizontal, Edit, Copy, Trash2, MapPin, Clock, Users, Plus, Filter, Ban, CheckCircle, Radio, ScanLine, ShieldCheck, ShieldOff, BarChart3 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { EventRegistrationModal } from "@/components/modals/event-registration-modal"
import { apiClient, Event } from "@/lib/api"
import { EventImage } from "@/components/events/event-image"
import { eventVariantUrl } from "@/lib/eventImageCache"
import { formatDisplayDate } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useAdminModulePermission } from "@/hooks/useAdminModulePermission"
import { useRouter } from "next/navigation"
import { JointScreeningDisplay } from "@/components/events/joint-screening-display"
import { EventScheduleMeta } from "@/components/events/event-schedule-meta"
import { WaitlistDisplay } from "@/components/events/waitlist-display"
import { formatEventPriceDisplay, isEventPaid, getEventVenueDisplay, hasVenueTierMatrix } from "@/lib/event-display-price"
import { RefundPolicyToggle } from "@/components/admin/refund-policy-toggle"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { LockedFeaturePage, FeatureUnavailableOverlay } from "@/components/feature-gate"

export default function EventsPage() {
  const router = useRouter()
  const { isAdmin, user } = useAuth()
  const { canEdit: canEditEvents } = useAdminModulePermission('events')
  const clubId = useRequiredClubId()
  const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("all")

  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map())
  const [refundPolicyEvent, setRefundPolicyEvent] = useState<Event | null>(null)
  const [refundPolicyModalOpen, setRefundPolicyModalOpen] = useState(false)

  useEffect(() => {
    fetchEvents()
    if (user && !isAdmin) {
      fetchUserRegistrations()
    }
  }, [searchTerm, categoryFilter, statusFilter, timeFilter, user, isAdmin, clubId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      if (!clubId) {
        setEvents([])
        setLoading(false)
        return
      }
      const response = await apiClient.getEventsByClub(clubId)

      if (response.success && response.data) {
        let filteredEvents = response.data

        if (searchTerm) {
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getEventVenueDisplay(event).toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        if (categoryFilter !== "all") {
          filteredEvents = filteredEvents.filter(event => event.category === categoryFilter)
        }

        if (statusFilter !== "all") {
          filteredEvents = filteredEvents.filter(event =>
            statusFilter === "active" ? event.isActive : !event.isActive
          )
        }

        if (timeFilter !== "all") {
          const now = new Date()
          filteredEvents = filteredEvents.filter(event => {
            const start = new Date(event.startTime)
            const end = event.endTime ? new Date(event.endTime) : null
            if (timeFilter === "upcoming") return start > now
            if (timeFilter === "live") return start <= now && (!end || end > now)
            return end ? end <= now : start < now
          })
        }

        setEvents(filteredEvents)
      } else {
        toast.error("Failed to fetch events")
      }
    } catch {
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
    } catch {
      // non-critical
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return
    try {
      const response = await apiClient.deleteEvent(eventId)
      if (response.success) {
        toast.success("Event deleted successfully")
        fetchEvents()
      } else {
        toast.error(response.error || "Failed to delete event")
      }
    } catch {
      toast.error("Error deleting event")
    }
  }

  const handleToggleStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.toggleEventStatus(eventId, !currentStatus)
      if (response.success) {
        toast.success(`Event ${!currentStatus ? "activated" : "deactivated"} successfully`)
        fetchEvents()
      } else {
        toast.error(response.error || "Failed to update event status")
      }
    } catch {
      toast.error("Error updating event status")
    }
  }

  const getRegistrationStatus = (eventId: string) => {
    const registration = userRegistrations.get(eventId)
    return registration ? registration.status : null
  }

  const isUserRegistered = (eventId: string) => userRegistrations.has(eventId)

  if (!isFeatureEnabled(clubFeatureConfig, 'events')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <DashboardLayout>
          <LockedFeaturePage
            featureKey="events"
            featureLabel="Events"
            clubId={clubId ?? ""}
            currentTier={clubFeatureConfig?.billing_tier}
          />
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="relative space-y-6">
          {clubId && (
            <FeatureUnavailableOverlay featureKey="events" featureLabel="Events" clubId={clubId} />
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Events Management</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Create and manage events for your supporter group</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.push("/dashboard/events/scanner")} className="flex-1 sm:flex-none">
                <ScanLine className="w-4 h-4 mr-2" />
                Scanner
              </Button>
              {canEditEvents && (
              <Button onClick={() => router.push("/dashboard/events/create")} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              )}
            </div>
          </div>

          {refundPolicyEvent && (
            <RefundPolicyToggle
              event={refundPolicyEvent}
              open={refundPolicyModalOpen}
              onClose={() => { setRefundPolicyModalOpen(false); setRefundPolicyEvent(null) }}
              onSuccess={(updated) => {
                setEvents(prev => prev.map(e => e._id === updated._id ? updated : e))
                setRefundPolicyModalOpen(false)
                setRefundPolicyEvent(null)
              }}
            />
          )}

          {/* Event Registration Modal (member-facing) */}
          <EventRegistrationModal
            isOpen={registrationModalOpen}
            onClose={() => {
              setRegistrationModalOpen(false)
              setSelectedEvent(null)
            }}
            onSuccess={() => {
              fetchEvents()
              if (user && !isAdmin) fetchUserRegistrations()
            }}
            event={selectedEvent}
            isRegistered={selectedEvent ? isUserRegistered(selectedEvent._id) : false}
            registrationStatus={selectedEvent ? getRegistrationStatus(selectedEvent._id) : undefined}
          />

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>Search and filter your events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Clock className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">🔴 Live Now</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Event</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[150px]">Date & Time</TableHead>
                      <TableHead className="min-w-[150px]">Location</TableHead>
                      <TableHead className="min-w-[120px]">Attendance</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading events...
                        </TableCell>
                      </TableRow>
                    ) : events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event._id}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <EventImage
                                eventId={event._id}
                                imageVersion={event.imageVersion}
                                size="list"
                                directUrl={eventVariantUrl(event, "list")}
                                alt={event.title}
                                aspectClassName="aspect-video"
                                className="w-24 shrink-0 rounded-md border"
                              />
                              <div className="min-w-[200px]">
                                <div className="font-medium break-words">{event.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-2 break-words">
                                  {event.description}
                                </div>
                                {isEventPaid(event) && (() => {
                                  const priceLabel = formatEventPriceDisplay(event, { fromPrefix: hasVenueTierMatrix(event) })
                                  return priceLabel ? (
                                    <p className="text-sm font-medium text-primary mt-1">{priceLabel}</p>
                                  ) : null
                                })()}
                                {hasVenueTierMatrix(event) && (
                                  <Badge variant="outline" className="mt-1 text-xs">Multi-venue</Badge>
                                )}
                                <JointScreeningDisplay
                                  jointScreening={event.jointScreening}
                                  variant="badge"
                                  className="mt-1"
                                />
                                <WaitlistDisplay waitlist={event.waitlist} variant="badge" className="mt-1" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">{formatDisplayDate(event.startTime)}</span>
                            </div>
                            {event.endTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>Ends: {formatDisplayDate(event.endTime)}</span>
                              </div>
                            )}
                            <EventScheduleMeta
                              bookingStartTime={event.bookingStartTime}
                              bookingEndTime={event.bookingEndTime}
                              attendancePoints={event.attendancePoints}
                              compact
                              className="mt-1"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-1 min-w-[150px]">
                              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="text-sm break-words">{getEventVenueDisplay(event)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className="text-sm">
                                {event.currentAttendees}
                                {event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
                                {event.maxAttendees != null && event.currentAttendees >= event.maxAttendees && (
                                  <span className="text-red-600 font-medium"> (FULL)</span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {!event.isActive && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                              {(() => {
                                const now = new Date()
                                const start = new Date(event.startTime)
                                const end = event.endTime ? new Date(event.endTime) : null
                                return start <= now && (!end || end > now) ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                                    <Radio className="w-3 h-3" />
                                    LIVE
                                  </span>
                                ) : null
                              })()}
                              {(() => {
                                const refundable = event.isRefundAllowed !== false && event.is_refund_allowed !== false
                                return (
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${refundable ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                    {refundable ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                                    {refundable ? 'Refundable' : 'No Refunds'}
                                  </span>
                                )
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isAdmin && event.isActive && (
                                <Button
                                  size="sm"
                                  variant={isUserRegistered(event._id) ? "outline" : "default"}
                                  onClick={() => { setSelectedEvent(event); setRegistrationModalOpen(true) }}
                                  disabled={event.maxAttendees != null && event.currentAttendees >= event.maxAttendees}
                                >
                                  {isUserRegistered(event._id) ? "Registered" : "Register"}
                                </Button>
                              )}

                              {isAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canEditEvents && (
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/events/create?edit=${event._id}`)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    )}
                                    {canEditEvents && (
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/events/create?duplicate=${event._id}`)}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/events/scanner?eventId=${event._id}`)}>
                                      <ScanLine className="w-4 h-4 mr-2" />
                                      Scan QR
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleStatus(event._id, event.isActive)}>
                                      {event.isActive ? (
                                        <>
                                          <Ban className="w-4 h-4 mr-2" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setRefundPolicyEvent(event); setRefundPolicyModalOpen(true) }}>
                                      {event.isRefundAllowed !== false && event.is_refund_allowed !== false ? (
                                        <>
                                          <ShieldOff className="w-4 h-4 mr-2" />
                                          Disable Refunds
                                        </>
                                      ) : (
                                        <>
                                          <ShieldCheck className="w-4 h-4 mr-2" />
                                          Enable Refunds
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/admin/refunds?tab=event-log&eventId=${event._id}&eventTitle=${encodeURIComponent(event.title)}`
                                        )
                                      }
                                    >
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      Refund Report
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteEvent(event._id)}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
