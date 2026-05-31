"use client";

import { Suspense, useEffect, useState } from "react";
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
import { formatLocalDate } from "@/lib/timezone";
import { User as UserInterface } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useRequiredClubId } from "@/hooks/useRequiredClubId";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  Infinity as InfinityIcon,
  User,
} from "lucide-react";
import EventDetailsModal from "@/components/modals/event-details-modal";
import UserEventRegistrationModal from "@/components/modals/user-event-registration-modal";
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal";
import { RefundConfirmationModal } from "@/components/modals/refund-confirmation-modal";
import { MemberTicketRefundAction } from "@/components/member/member-ticket-refund-action";
import { RefundPolicyBadge } from "@/components/refund-policy-badge";
import { JointScreeningDisplay } from "@/components/events/joint-screening-display";
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal";

const eventCategories = [
  "all",
  "screenings",
  "footy-meets",
  "tournaments",
  "auctions",
  "club-events",
  "social-events",
  "csr-events",
  "watch-parties",
  "travel-days",
  "workshops",
  "general-meeting",
  "matchday",
  "others",
];

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

function UserEventsPageInner() {
  const { user } = useAuth() as { user: UserInterface };
  const clubId = useRequiredClubId();
  const searchParams = useSearchParams();
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
  const [eventForPayment, setEventForPayment] = useState<Event | null>(null);
  const [attendeesForPayment, setAttendeesForPayment] = useState<any[]>([]);
  const [couponForPayment, setCouponForPayment] = useState<{ code: string; discount: number } | null>(null);
  const [handledDeepLinkEventId, setHandledDeepLinkEventId] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<Array<{
    eventId: string;
    eventTitle: string;
    eventStartTime: string;
    eventVenue: string;
    position: number;
    status: 'pending' | 'notified';
    purchaseLinkExpiresAt?: string;
    purchaseToken?: string;
  }>>([]);
  const [joiningWaitlistId, setJoiningWaitlistId] = useState<string | null>(null);
  const [decliningWaitlistId, setDecliningWaitlistId] = useState<string | null>(null);
  const [waitlistTokenForCheckout, setWaitlistTokenForCheckout] = useState<string | null>(null);
  const [refundCancelEventId, setRefundCancelEventId] = useState<string | null>(null);
  const [refundEstimate, setRefundEstimate] = useState<any | null>(null);
  const [refundModalLoading, setRefundModalLoading] = useState(false);
  const [refundModalError, setRefundModalError] = useState<string | null>(null);
  const [showVenueTierCartModal, setShowVenueTierCartModal] = useState(false);
  const [venueTierEvent, setVenueTierEvent] = useState<Event | null>(null);

  const hasVenueTierMatrix = (event: Event | null | undefined) =>
    Boolean(
      event &&
      Array.isArray(event.venues) &&
      event.venues.some((v) => Array.isArray(v?.tiers) && v.tiers.length > 0)
    );

  useEffect(() => {
    fetchEvents();
  }, [clubId]);

  useEffect(() => {
    if (!user) return;
    apiClient.getMyWaitlistStatus().then((res) => {
      if (res.success && res.data) setWaitlistStatus(res.data);
    });
  }, [user]);

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    const token = searchParams.get("waitlistToken");
    if (!eventId) return;
    if (handledDeepLinkEventId === eventId && !token) return;
    if (loading) return;

    const openFound = (ev: Event, openCheckout = false, t?: string) => {
      setSelectedEventForDetails(ev);
      setShowEventDetailsModal(true);
      setHandledDeepLinkEventId(eventId);
      if (openCheckout && t && ev) {
        setEventForPayment({ ...ev, price: ev.ticketPrice ?? 0 } as Event & { price: number });
        setAttendeesForPayment([{ name: (user as any)?.name || `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || 'Attendee', phone: (user as any)?.phoneNumber || (user as any)?.phone || '' }]);
        setCouponForPayment(null);
        setWaitlistTokenForCheckout(t);
        setShowEventCheckoutModal(true);
      }
    };

    if (token) {
      apiClient.validateWaitlistToken(eventId, token).then((res) => {
        if (res.success && (res.data as any)?.valid && (res.data as any)?.event) {
          const ev = (res.data as any).event as Event;
          openFound(ev, true, token);
        }
        setHandledDeepLinkEventId(eventId);
      });
      return;
    }

    const found = events.find((e) => String(e._id) === String(eventId));
    if (found) {
      openFound(found);
      return;
    }

    (async () => {
      const res = await apiClient.getPublicEventById(eventId);
      if (res.success && res.data) {
        openFound(res.data as any);
      } else {
        setHandledDeepLinkEventId(eventId);
      }
    })();
  }, [events, handledDeepLinkEventId, loading, searchParams, user]);

  useEffect(() => {
    const refund = searchParams.get("refund");
    const eventId = searchParams.get("eventId");
    if (refund !== "1" || !eventId || loading) return;
    const found = events.find((e) => String(e._id) === String(eventId));
    if (found) {
      initiateRefundCancel(found._id);
    }
  }, [searchParams, events, loading]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (!clubId) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const response = await apiClient.getPublicEvents(clubId);

      if (response.success && response.data) {
        const data: any = response.data;
        const eventsData = Array.isArray(data) ? data : (data?.events || []);
        setEvents(eventsData);
      } else {
        toast.error("Failed to fetch events");
      }
    } catch (error) {
      toast.error("Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = (eventId: string) => {
    if (!user) {
      toast.error("Please log in to register for events");
      return;
    }
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    if (hasVenueTierMatrix(event)) {
      setVenueTierEvent(event);
      setShowVenueTierCartModal(true);
      return;
    }

    setRegistrationEventId(eventId);
    setRegistrationEvent(event);
    setShowRegistrationModal(true);
  };

  const handleJoinWaitlist = async (eventId: string) => {
    try {
      setJoiningWaitlistId(eventId);
      const res = await apiClient.joinWaitlist(eventId);
      if (res.success) {
        toast.success(`Joined waitlist at position ${res.data?.position || 1}`);
        fetchEvents();
        apiClient.getMyWaitlistStatus().then((r) => r.success && r.data && setWaitlistStatus(r.data));
      } else {
        toast.error(res.error || res.message || "Failed to join waitlist");
      }
    } catch {
      toast.error("Failed to join waitlist");
    } finally {
      setJoiningWaitlistId(null);
    }
  };

  const handleDeclineWaitlistOffer = async (eventId: string) => {
    if (!confirm("Decline this waitlist offer? The next person in line will be notified.")) return;
    try {
      setDecliningWaitlistId(eventId);
      const res = await apiClient.declineWaitlistOffer(eventId);
      if (res.success) {
        toast.success("Offer declined");
        fetchEvents();
        apiClient.getMyWaitlistStatus().then((r) => r.success && r.data && setWaitlistStatus(r.data));
      } else {
        toast.error(res.error || res.message || "Failed to decline");
      }
    } catch {
      toast.error("Failed to decline");
    } finally {
      setDecliningWaitlistId(null);
    }
  };

  const isUserOnWaitlist = (eventId: string) => {
    return waitlistStatus.some((w) => String(w.eventId) === String(eventId));
  };

  const getWaitlistEntry = (eventId: string) => {
    return waitlistStatus.find((w) => String(w.eventId) === String(eventId));
  };

  const handlePerformRegistration = async (payload: {
    eventId: string;
    attendees: any[];
    couponCode?: string;
  }) => {
    if (!payload || !payload.eventId) return;

    const event = events.find((e) => e._id === payload.eventId);
    if (!event) {
      toast.error("Event not found. Please refresh and try again.");
      return;
    }

    if (hasVenueTierMatrix(event)) {
      setVenueTierEvent(event);
      setShowVenueTierCartModal(true);
      return;
    }

    if (payload.couponCode) {
      setCouponForPayment({ code: payload.couponCode, discount: 0 });
    } else {
      setCouponForPayment(null);
    }
    setShowEventCheckoutModal(true);
    setEventForPayment({ ...event, price: event.ticketPrice ?? 0 } as Event & {
      price: number;
    });
    setAttendeesForPayment(payload.attendees);
  };

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'date-short');
  };

  const formatTime = (dateString: string) => {
    return formatLocalDate(dateString, 'time-only');
  };
  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'CA$',
    JPY: '¥',
    CNY: '¥',
    BRL: 'R$',
    MXN: '$',
    ZAR: 'R',
    CHF: 'CHF',
    SEK: 'kr',
    NZD: 'NZ$',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    TRY: '₺',
    DKK: 'kr',
    ILS: '₪',
    PLN: 'zł'
  };

  const formatCurrency = (amount: number | undefined, cur?: string) => {
    const c = cur || "INR";
    const symbol = currencySymbols[c] || `${c} `;
    return `${symbol}${Number(amount || 0).toLocaleString()}`;
  };
  const getCapacity = (event: Event): { count: number; max: number | null } => {
    if (event.venues?.length) {
      let total = 0, sold = 0;
      for (const v of event.venues) {
        for (const t of v.tiers) {
          total += t.allocation ?? 0;
          sold += t.sold ?? 0;
        }
      }
      return { count: sold, max: total };
    }
    return { count: event.currentAttendees || 0, max: event.maxAttendees ?? null };
  };

  const isEventFull = (event: Event) => {
    const { count, max } = getCapacity(event);
    return max !== null ? count >= max : false;
  };

  const getVenueDisplay = (event: Event) => {
    if (event.venues && event.venues.length > 0) {
      return event.venues.map(v => v.name).join(", ");
    }
    return event.venue || "—";
  };

  const getMatrixPriceDisplay = (event: Event): string | null => {
    if (!event.venues?.length) return null;
    const allPrices = event.venues.flatMap(v => v.tiers.map(t => t.price));
    if (!allPrices.length) return null;
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const sym = currencySymbols[event.currency ?? "INR"] ?? (event.currency + " ");
    return min === max ? `${sym}${min.toLocaleString()}` : `${sym}${min.toLocaleString()} – ${sym}${max.toLocaleString()}`;
  };

  const isEventUpcoming = (event: Event) => {
    return new Date(event.startTime) > new Date();
  };

  const isEventMembersOnly = (event: Event) => {
    return (event.memberOnly ? user?.memberships?.map(a => a?.club_id?._id).includes(event.clubId || "null") || false : true)
  }

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
    try {
      setCancellingEventId(eventId);
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
      }
    } catch (error) {
      toast.error("Failed to cancel registration");
    } finally {
      setCancellingEventId(null);
    }
  };

  const initiateRefundCancel = async (eventId: string) => {
    try {
      setRefundModalLoading(true);
      setRefundModalError(null);
      const policyRes = await apiClient.getEventRefundPolicy(eventId);
      const policy = policyRes.success && policyRes.data ? policyRes.data : null;
      if (policy?.event_cancelled) {
        toast.info("This event was cancelled by the club. Automatic refund processing applies.");
        return;
      }
      if (policy && policy.is_refund_allowed === false) {
        toast.error("Policy restriction", {
          description: "This ticket is non-refundable and cannot be cancelled for a refund.",
        });
        return;
      }
      if (policy?.refund_window_closed) {
        toast.error("Refund window closed", {
          description: "The club's cancellation cut-off has passed for this event.",
        });
        return;
      }
      const res = await apiClient.estimateRefund({ sourceType: 'event_ticket', eventId });
      if (res.success && res.data) {
        const rawData = res.data as any;
        const estimate = rawData?.data != null ? rawData.data : rawData;
        if (!estimate.breakdown?.grossPaid && estimate.estimatedRefund === 0) {
          await handleCancelRegistration(eventId);
          return;
        }
        setRefundEstimate(estimate);
        setRefundCancelEventId(eventId);
      } else {
        await handleCancelRegistration(eventId);
      }
    } catch {
      toast.error('Failed to fetch refund estimate');
    } finally {
      setRefundModalLoading(false);
    }
  };

  const handleConfirmRefundCancel = async () => {
    if (!refundCancelEventId) return;
    try {
      setRefundModalLoading(true);
      setRefundModalError(null);
      const res = await apiClient.requestRefund({ sourceType: 'event_ticket', eventId: refundCancelEventId });
      if (res.success) {
        setRefundCancelEventId(null);
        setRefundEstimate(null);
        toast.success('Ticket cancelled. Refund will be processed in 5-7 working days.');
        await fetchEvents();
      } else {
        setRefundModalError((res as any).error || 'Failed to request refund');
      }
    } catch {
      setRefundModalError('Failed to request refund');
    } finally {
      setRefundModalLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const searchMatch =
      !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());

    const categoryMatch =
      categoryFilter === "all" || event.category === categoryFilter;

    return searchMatch && categoryMatch;
  });

  const upcomingEvents = filteredEvents.filter((event) =>
    isEventUpcoming(event) && isEventMembersOnly(event)
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

          {waitlistStatus.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold">My Waitlist Status</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Events you are on the waitlist for
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {waitlistStatus.map((w) => (
                  <Card key={w.eventId} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{w.eventTitle}</CardTitle>
                      <CardDescription>{w.eventVenue}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Badge variant="outline">Position: {w.position}</Badge>
                      <Badge variant={w.status === "notified" ? "default" : "secondary"}>
                        {w.status === "notified" ? "Purchase available" : "Waiting"}
                      </Badge>
                      {w.status === "notified" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              const ev = events.find((e) => String(e._id) === String(w.eventId));
                              const eventData = ev || (await apiClient.getPublicEventById(String(w.eventId)).then((r) => r.success ? r.data : null));
                              if (!eventData) {
                                toast.error("Event not found");
                                return;
                              }
                              setEventForPayment({
                                _id: w.eventId,
                                name: w.eventTitle,
                                title: w.eventTitle,
                                ticketPrice: (eventData as any).ticketPrice ?? 0,
                                price: (eventData as any).ticketPrice ?? 0,
                                currency: (eventData as any).currency,
                              } as any);
                              setAttendeesForPayment([{ name: (user as any)?.name || `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || "Attendee", phone: (user as any)?.phoneNumber || (user as any)?.phone || "" }]);
                              setCouponForPayment(null);
                              setWaitlistTokenForCheckout(w.purchaseToken || null);
                              setShowEventCheckoutModal(true);
                            }}>
                            Purchase
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineWaitlistOffer(String(w.eventId))}
                            disabled={decliningWaitlistId === String(w.eventId)}>
                            Decline
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

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
                          <div className="ml-2 flex-shrink-0 space-y-1 flex flex-col items-end">
                            <Badge variant="secondary" className="block">
                              {event.category}
                            </Badge>
                            <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
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
                            <span className="truncate">{getVenueDisplay(event)}</span>
                          </div>
                        </div>
                        <div className="pt-2">
                          {(() => {
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
                          <div className="ml-2 flex-shrink-0 space-y-1 flex flex-col items-end">
                            <Badge variant="secondary" className="block">
                              {event.category}
                            </Badge>
                            <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
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
                            <span className="truncate">{getVenueDisplay(event)}</span>
                          </div>
                          {(() => {
                            const { count, max } = getCapacity(event);
                            return (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs">
                                  {count}{max !== null ? `/${max}` : ""} attendees
                                </span>
                              </div>
                            );
                          })()}
                          {event.venues?.length ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">
                                {getMatrixPriceDisplay(event)}
                              </span>
                              <Badge variant="outline" className="text-xs">Multi-venue</Badge>
                            </div>
                          ) : event.ticketPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">
                                Price: {formatCurrency(event.ticketPrice, (event as any).currency)}
                              </span>
                            </div>
                          ) : null}
                          <JointScreeningDisplay jointScreening={event.jointScreening} variant="badge" />
                        </div>

                        {(() => {
                          const { count, max } = getCapacity(event);
                          const pct = max !== null ? Math.min(Math.round((count / max) * 100), 100) : 0;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Capacity</span>
                                {max !== null && <span>{pct}%</span>}
                              </div>
                              {max !== null ? (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-green-500"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <InfinityIcon className="h-3 w-3" />
                                  <span>Unlimited capacity</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="pt-2">
                          {(() => {
                            const myReg = user?._id
                              ? (event.registrations || []).find((r: any) => r.userId === user._id)
                              : null;

                            const hasConfirmed = (event.registrations || []).some(
                              (r: any) => r.userId === user._id && r.status === "confirmed"
                            );
                            if (hasConfirmed) {
                              return (
                                <div className="flex gap-2">
                                  <Button
                                    disabled
                                    className="w-full"
                                    variant="outline">
                                    Registered
                                  </Button>
                                  <MemberTicketRefundAction
                                    eventId={event._id}
                                    eventIsActive={event.isActive !== false}
                                    onRequestRefund={() => initiateRefundCancel(event._id)}
                                    loading={cancellingEventId === event._id || refundModalLoading}
                                  />
                                </div>
                              );
                            }
                            if (event.maxAttendees && isEventFull(event)) {
                              const ev = event as any;
                              const waitlistEnabled = ev.waitlist?.enabled;
                              const onWaitlist = isUserOnWaitlist(event._id);
                              const waitlistEntry = getWaitlistEntry(event._id);
                              if (waitlistEnabled && onWaitlist && waitlistEntry) {
                                return (
                                  <div className="space-y-2">
                                    <Badge variant="outline" className="block w-fit">
                                      Position: {waitlistEntry.position} ({waitlistEntry.status})
                                    </Badge>
                                    {waitlistEntry.status === "notified" && (
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => {
                                            setEventForPayment({ ...event, price: event.ticketPrice ?? 0 } as Event & { price: number });
                                            setAttendeesForPayment([{ name: (user as any)?.name || `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || "Attendee", phone: (user as any)?.phoneNumber || (user as any)?.phone || "" }]);
                                            setCouponForPayment(null);
                                            setWaitlistTokenForCheckout(waitlistEntry.purchaseToken || null);
                                            setShowEventCheckoutModal(true);
                                          }}
                                          className="w-full">
                                          Purchase Ticket
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleDeclineWaitlistOffer(event._id)}
                                          disabled={decliningWaitlistId === event._id}>
                                          Decline
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              if (waitlistEnabled && !onWaitlist) {
                                return (
                                  <Button
                                    onClick={() => handleJoinWaitlist(event._id)}
                                    disabled={joiningWaitlistId === event._id}
                                    variant="outline"
                                    className="w-full">
                                    {joiningWaitlistId === event._id ? "Joining..." : "Join Waitlist"}
                                  </Button>
                                );
                              }
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
                          <div className="ml-2 flex-shrink-0 space-y-1 flex flex-col items-end">
                            <Badge variant="secondary" className="block">
                              {event.category}
                            </Badge>
                            <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
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
                            <span className="truncate">{getVenueDisplay(event)}</span>
                          </div>
                          {(() => {
                            const { count, max } = getCapacity(event);
                            return (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs">
                                  {count}{max !== null ? `/${max}` : ""} attendees
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {(() => {
                          const { count, max } = getCapacity(event);
                          const pct = max !== null ? Math.min(Math.round((count / max) * 100), 100) : 0;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Capacity</span>
                                {max !== null && <span>{pct}%</span>}
                              </div>
                              {max !== null ? (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-green-500"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <InfinityIcon className="h-3 w-3" />
                                  <span>Unlimited capacity</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
        onClose={() => { setShowEventCheckoutModal(false); setWaitlistTokenForCheckout(null); }}
        event={
          eventForPayment
            ? {
              _id: (eventForPayment as any)._id,
              name: (eventForPayment as any).title || (eventForPayment as any).name || "Event",
              price: (eventForPayment as any).ticketPrice ?? (eventForPayment as any).price ?? 0,
              ticketPrice: (eventForPayment as any).ticketPrice,
              earlyBirdDiscount: (eventForPayment as any).earlyBirdDiscount,
              memberDiscount: (eventForPayment as any).memberDiscount,
              groupDiscount: (eventForPayment as any).groupDiscount,
              currency: (eventForPayment as any).currency,
            }
            : undefined
        }
        attendees={attendeesForPayment}
        couponCode={couponForPayment?.code}
        waitlistToken={waitlistTokenForCheckout}
        onSuccess={() => {
          setShowEventCheckoutModal(false);
          setWaitlistTokenForCheckout(null);
          fetchEvents();
          apiClient.getMyWaitlistStatus().then((r) => r.success && r.data && setWaitlistStatus(r.data));
          toast.success("Payment successful!");
        }}
        onFailure={() => {
          toast.error("Payment failed. Please try again.");
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
            setRefundCancelEventId(null);
            setRefundEstimate(null);
            setRefundModalError(null);
          }}
        />
      )}
      <VenueTierCartModal
        isOpen={showVenueTierCartModal}
        onClose={() => { setShowVenueTierCartModal(false); setVenueTierEvent(null); }}
        event={venueTierEvent}
        onSuccess={() => {
          setShowVenueTierCartModal(false);
          setVenueTierEvent(null);
          fetchEvents();
        }}
        onFailure={() => {
          setShowVenueTierCartModal(false);
        }}
      />
    </ProtectedRoute>
  );
}

export default function UserEventsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <UserEventsPageInner />
    </Suspense>
  );
}
