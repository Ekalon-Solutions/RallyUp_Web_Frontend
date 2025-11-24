"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { apiClient, Event } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  Infinity as InfinityIcon,
  Trash,
  User,
} from "lucide-react";
import EventDetailsModal from "@/components/modals/event-details-modal";
import UserEventRegistrationModal from "@/components/modals/user-event-registration-modal";
import { CheckoutModal } from "@/components/modals/checkout-modal";
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal";
import { EventPaymentSimulationModal } from "@/components/modals/event-payment-simulation-modal";

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
  "entertainment",
];

// Component to display attendance marker with user's registration data
function AttendanceMarker({
  event,
  userId,
}: {
  event: Event;
  userId?: string;
}) {
  const [registration, setRegistration] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event || !userId) {
      setRegistration(null);
      setLoading(false);
      return;
    }

    // Find the user's registration entry
    const regs = (event.registrations || []) as any[];
    const myRegEntry = regs.find(
      (r) => r && String(r.userId) === String(userId) && r.registrationId
    );

    if (myRegEntry && myRegEntry.registrationId) {
      setLoading(true);
      apiClient
        .getRegistrationById(String(myRegEntry.registrationId))
        .then((res) => {
          if (res && res.success && res.data && res.data.registration) {
            setRegistration(res.data.registration);
          } else {
            setRegistration(null);
          }
        })
        .catch(() => {
          setRegistration(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setRegistration(null);
      setLoading(false);
    }
  }, [event, userId]);

  if (loading) {
    return (
      <Badge
        variant="secondary"
        className="w-fit ml-auto text-sm mt-1 flex items-center gap-1">
        <User className="w-3 h-3" />
        <span>...</span>
      </Badge>
    );
  }

  if (!registration || !Array.isArray(registration.attendees)) {
    return null;
  }

  const totalRegistrations = registration.attendees.length;
  const totalAttended = registration.attendees.filter(
    (att: any) => att.attended === true
  ).length;

  return (
    <Badge
      variant="secondary"
      className="w-fit ml-auto text-sm mt-1 flex items-center gap-1">
      <User className="w-3 h-3" />
      <span>
        {totalAttended}/{totalRegistrations}
      </span>
    </Badge>
  );
}

export default function UserEventsPage() {
  const { user } = useAuth();
  console.log("events user:", user);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedEventForDetails, setSelectedEventForDetails] =
    useState<Event | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [registrationEventId, setRegistrationEventId] = useState<string | null>(
    null
  );
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(
    null
  );
  const [showEventCheckoutModal, setShowEventCheckoutModal] = useState(false);
  const [showEventPaymentSimulationModal, setShowEventPaymentSimulationModal] =
    useState(false);
  const [eventForPayment, setEventForPayment] = useState<Event | null>(null);
  const [attendeesForPayment, setAttendeesForPayment] = useState<any[]>([]);
  const [couponForPayment, setCouponForPayment] = useState<{code: string; discount: number} | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPublicEvents();

      if (response.success && response.data) {
        setEvents(response.data);
      } else {
        console.error("Failed to fetch events:", response.error);
        toast.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  // Open registration modal instead of immediately calling the API.
  const handleEventRegistration = (eventId: string) => {
    if (!user) {
      toast.error("Please log in to register for events");
      return;
    }
    const event = events.find(e => e._id === eventId);
    setRegistrationEventId(eventId);
    setRegistrationEvent(event || null);
    setShowRegistrationModal(true);
  };

  // Frontend-only handler that receives registration payload from the modal
  const handlePerformRegistration = async (payload: {
    eventId: string;
    attendees: any[];
    couponCode?: string;
  }) => {
    if (!payload || !payload.eventId) return;

    const event = events.find((e) => e._id === payload.eventId);
    if (event?.ticketPrice) {
      // Calculate discount if coupon was applied
      let discountAmount = 0;
      if (payload.couponCode) {
        // The coupon was already validated in the modal, so we trust the discount
        // We'll pass it to the checkout modal
        setCouponForPayment({ code: payload.couponCode, discount: 0 }); // Will be calculated in checkout
      } else {
        setCouponForPayment(null);
      }
      
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
    setRegistrationEventId(event?._id || "");
    setShowRegistrationModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getAttendancePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const isEventFull = (event: Event) => {
    return event.maxAttendees
      ? event.currentAttendees >= event.maxAttendees
      : false;
  };

  const isEventUpcoming = (event: Event) => {
    return new Date(event.bookingEndTime) > new Date() && new Date(event.bookingStartTime) < new Date();
  };

  const isEventPast = (event: Event) => {
    return event.endTime ? new Date(event.endTime) < new Date() : false;
  };

  const isEventOngoing = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = event.endTime ? new Date(event.endTime) : new Date().setDate((new Date().getDate()) + 1);
    return start <= now && now < end;
  };

  const eventsUserIsRegisteredForOngoing = () => {
    if (!user) return [] as Event[];
    return (events || []).filter((ev) => {
      const regs = ev.registrations || [];
      const found = regs.find((r: any) => r.userId === user._id);
      return !!found && isEventOngoing(ev);
    });
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!eventId) return;
    if (
      !confirm(
        "Are you sure you want to cancel your registration for this event?"
      )
    )
      return;
    try {
      setCancellingEventId(eventId);
      // Call the API and inspect the response object
      const res = await apiClient.cancelEventRegistration(eventId);
      if (res && res.success) {
        toast.success(res.data?.message || "Registration cancelled");
        await fetchEvents();
      } else {
        const msg =
          res?.error ||
          res?.message ||
          `Cancellation failed (status ${res?.status ?? "unknown"})`;
        toast.error(msg);
        console.error("Cancel registration failed:", res);
      }
    } catch (error) {
      console.error("Cancel registration error", error);
      toast.error("Failed to cancel registration");
    } finally {
      setCancellingEventId(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    // Apply search filter
    const searchMatch =
      !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply category filter
    const categoryMatch =
      categoryFilter === "all" || event.category === categoryFilter;

    return searchMatch && categoryMatch;
  });

  const upcomingEvents = filteredEvents.filter((event) =>
    isEventUpcoming(event)
  );
  const pastEvents = filteredEvents.filter((event) => isEventPast(event));

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">
              Discover and register for upcoming events
            </p>
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
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all"
                          ? "All Categories"
                          : category.charAt(0).toUpperCase() +
                            category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ongoing Events */}
          <div className="space-y-4">
            <div className="mt-4">
              <h4 className="text-md font-semibold">Ongoing events</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Ongoing events that you've registered for
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsUserIsRegisteredForOngoing().length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        No ongoing events that you're registered for right now.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  eventsUserIsRegisteredForOngoing().map((event) => (
                    <Card
                      key={event._id}
                      className="overflow-hidden hover:shadow-md transition-shadow">
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
                            <Badge variant="secondary" className="block">
                              {event.category}
                            </Badge>
                            {/* Attendance marker */}
                            <AttendanceMarker
                              event={event}
                              userId={user?._id}
                            />
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
                            <span>
                              {new Date(event.startTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>
                        <div className="pt-2">
                          {(() => {
                            const isRegistered = Boolean(
                              user?._id &&
                                (event.registrations || []).some(
                                  (r: any) => r.userId === user._id
                                )
                            );
                            return (
                              <Button
                                onClick={() => {
                                  setSelectedEventForDetails(event);
                                  setShowEventDetailsModal(true);
                                }}
                                className="w-full">
                                View event
                              </Button>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )))
                }
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
                  <p className="mt-4 text-muted-foreground">
                    Loading events...
                  </p>
                </div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">
                      No upcoming events
                    </h3>
                    <p className="text-muted-foreground">
                      Check back later for new events
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime()
                  )
                  .map((event) => (
                    <Card
                      key={event._id}
                      className="overflow-hidden hover:shadow-md transition-shadow">
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
                            <Badge variant="secondary" className="block">
                              {event.category}
                            </Badge>
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
                            <span>
                              Starts {formatDate(event.startTime)} at{" "}
                              {formatTime(event.startTime)}
                            </span>
                          </div>
                          {event.endTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>
                                Ends {formatDate(event.endTime)} at{" "}
                                {formatTime(event.endTime)}
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
                              {event.maxAttendees
                                ? `/${event.maxAttendees}`
                                : ""}{" "}
                              attendees
                            </span>
                          </div>
                          {event.ticketPrice && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">
                                Price: ${event.ticketPrice}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Attendance Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Capacity</span>
                            {event.maxAttendees && (
                              <span>
                                {getAttendancePercentage(
                                  event.currentAttendees || 0,
                                  event.maxAttendees
                                )}
                                %
                              </span>
                            )}
                          </div>
                          {event.maxAttendees ? (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  getAttendancePercentage(
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
                                }}></div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <InfinityIcon className="h-3 w-3" />
                              <span>Unlimited capacity</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          {(() => {
                            const isRegistered =
                              user?._id &&
                              (event.registrations || []).some(
                                (r: any) => r.userId === user._id
                              );
                            if (isRegistered) {
                              return (
                                <div className="flex gap-2">
                                  <Button
                                    disabled
                                    className="w-full"
                                    variant="outline">
                                    Registered
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelRegistration(event._id);
                                    }}
                                    disabled={cancellingEventId === event._id}
                                    className="h-10 w-10 p-0 flex items-center justify-center"
                                    title="Cancel registration">
                                    <Trash className="w-4 h-4 text-white" />
                                  </Button>
                                </div>
                              );
                            } else if (
                              event.maxAttendees &&
                              isEventFull(event)
                            ) {
                              return (
                                <Button
                                  disabled
                                  className="w-full"
                                  variant="secondary">
                                  Event Full
                                </Button>
                              );
                            } else {
                              return (
                                <Button
                                  onClick={() =>
                                    handleEventRegistration(event._id)
                                  }
                                  className="w-full">
                                  Register for Event
                                </Button>
                              );
                            }
                          })()}
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
                  .sort(
                    (a, b) =>
                      new Date(b.startTime).getTime() -
                      new Date(a.startTime).getTime()
                  )
                  .map((event) => (
                    <Card
                      key={event._id}
                      className="overflow-hidden hover:shadow-md transition-shadow">
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
                            <Badge variant="secondary" className="block">
                              {event.category}
                            </Badge>
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
                            <span>
                              {new Date(event.startTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs">
                              {event.currentAttendees}
                              {event.maxAttendees
                                ? `/${event.maxAttendees}`
                                : ""}{" "}
                              attendees
                            </span>
                          </div>
                        </div>

                        {/* Attendance Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Capacity</span>
                            {event.maxAttendees && (
                              <span>
                                {getAttendancePercentage(
                                  event.currentAttendees || 0,
                                  event.maxAttendees
                                )}
                                %
                              </span>
                            )}
                          </div>
                          {event.maxAttendees ? (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  getAttendancePercentage(
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
                                }}></div>
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
        onClose={() => {
          setShowEventDetailsModal(false);
          setSelectedEventForDetails(null);
        }}
      />
      <UserEventRegistrationModal
        eventId={registrationEventId}
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setRegistrationEventId(null);
          setRegistrationEvent(null);
        }}
        onRegister={handlePerformRegistration}
        ticketPrice={registrationEvent?.ticketPrice || 0}
        event={registrationEvent}
      />
        <EventCheckoutModal
          isOpen={showEventCheckoutModal}
          onClose={() => setShowEventCheckoutModal(false)}
          event={eventForPayment}
          attendees={attendeesForPayment}
          couponCode={couponForPayment?.code}
          onSuccess={() => {
            setShowEventCheckoutModal(false);
            setShowEventPaymentSimulationModal(true);
          }}
        />

        <EventPaymentSimulationModal
          isOpen={showEventPaymentSimulationModal}
          onClose={() => setShowEventPaymentSimulationModal(false)}
          event={eventForPayment}
          attendees={attendeesForPayment}
          couponCode={couponForPayment?.code}
          onPaymentSuccess={() => {
            setShowEventPaymentSimulationModal(false);
            fetchEvents();
            toast.success("Payment successful!");
          }}
          onPaymentFailure={() => {
            setShowEventPaymentSimulationModal(false);
            toast.error("Payment failed. Please try again.");
          }}
        />
    </ProtectedRoute>
  );
}
