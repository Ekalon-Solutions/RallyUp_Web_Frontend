"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, MoreHorizontal, Edit, Trash2, MapPin, Clock, Users, Plus, Filter } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CreateEventModal } from "@/components/modals/create-event-modal"
import { EventRegistrationModal } from "@/components/modals/event-registration-modal"
import { apiClient, Event } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useCallback, useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CouponsTab } from "@/components/tabs/coupons-tab";

export default function EventsPage() {
  const { isAdmin, user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Form states for add/edit event
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Registration modal states
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    fetchEvents()
    if (user && !isAdmin) {
      fetchUserRegistrations()
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter, user, isAdmin])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getEvents()

      if (response.success && response.data) {
        let filteredEvents = response.data

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

        // Apply status filter
        if (statusFilter !== "all") {
          filteredEvents = filteredEvents.filter(event => 
            statusFilter === "active" ? event.isActive : !event.isActive
          )
        }

        setEvents(filteredEvents)
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
      console.error("Error fetching user registrations:", error)
    }
  }

  const handleRegisterForEvent = (event: Event) => {
    setSelectedEvent(event)
    setRegistrationModalOpen(true)
  }

  const handleRegistrationSuccess = () => {
    fetchEvents()
    if (user && !isAdmin) {
      fetchUserRegistrations()
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
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Error deleting event")
    }
  }

  const handleToggleStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.toggleEventStatus(eventId, !currentStatus)
      if (response.success) {
        toast.success(`Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchEvents()
      } else {
        toast.error(response.error || "Failed to update event status")
      }
    } catch (error) {
      console.error("Error toggling event status:", error)
      toast.error("Error updating event status")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getRegistrationStatus = (eventId: string) => {
    const registration = userRegistrations.get(eventId)
    return registration ? registration.status : null
  }

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.has(eventId)
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Events Management</h1>
                  <p className="text-muted-foreground">Create and manage events for your supporter group</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {/* Create Event Modal */}
              <CreateEventModal
                isOpen={isAddDialogOpen}
                onClose={() => {
                  setIsAddDialogOpen(false)
                  setEditingEvent(null)
                }}
                onSuccess={() => {
                  fetchEvents()
                  setIsAddDialogOpen(false)
                  setEditingEvent(null)
                }}
                editEvent={editingEvent}
              />

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
                        <SelectItem value="match-screening">Match Screening</SelectItem>
                        <SelectItem value="away-day">Away Day Travel</SelectItem>
                        <SelectItem value="social">Social Event</SelectItem>
                        <SelectItem value="fundraising">Fundraising</SelectItem>
                        <SelectItem value="meeting">Club Meeting</SelectItem>
                        <SelectItem value="community-outreach">Community Outreach</SelectItem>
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
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                                <div>
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-2">
                                    {event.description}
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
                                  <span className="text-sm">{formatDate(event.startTime)}</span>
                                </div>
                                {event.endTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>Ends: {formatDate(event.endTime)}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-sm">{event.venue}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span className="text-sm">
                                    {event.currentAttendees}
                                    {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                                    {event.maxAttendees && event.currentAttendees >= event.maxAttendees && (
                                      <span className="text-red-600 font-medium"> (FULL)</span>
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={event.isActive ? "default" : "secondary"}>
                                  {event.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Registration Button for Users */}
                                  {!isAdmin && event.isActive && (
                                    <Button
                                      size="sm"
                                      variant={isUserRegistered(event._id) ? "outline" : "default"}
                                      onClick={() => handleRegisterForEvent(event)}
                                      disabled={event.maxAttendees && event.currentAttendees >= event.maxAttendees}
                                    >
                                      {isUserRegistered(event._id) ? "Registered" : "Register"}
                                    </Button>
                                  )}
                                  
                                  {/* Admin Actions */}
                                  {isAdmin && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setEditingEvent(event)
                                          setIsAddDialogOpen(true)
                                        }}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleStatus(event._id, event.isActive)}>
                                          {event.isActive ? "Deactivate" : "Activate"}
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
          </TabsContent>

          <TabsContent value="coupons">
            {/* Coupons Management Tab */}
            <CouponsTab />
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
