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
import { useSocket } from "@/contexts/socket-context";
import { formatLocalDate } from "@/lib/timezone";
import { isUserRegisteredForEvent, extractCancellableAttendeesFromApiResponse } from "@/lib/event-registration";
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
  CalendarX,
} from "lucide-react";
import EventDetailsModal from "@/components/modals/event-details-modal";
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal";
import { RefundConfirmationModal } from "@/components/modals/refund-confirmation-modal";
import { AttendeeTicketSelectModal, CancellableAttendee } from "@/components/modals/attendee-ticket-select-modal";
import { MemberTicketRefundAction } from "@/components/member/member-ticket-refund-action";
import { RefundPolicyBadge } from "@/components/refund-policy-badge";
import { EventImage } from "@/components/events/event-image";
import { eventVariantUrl } from "@/lib/eventImageCache";
import { isEventNonRefundable } from "@/lib/refund-policy";
import { JointScreeningDisplay } from "@/components/events/joint-screening-display";
import { EventScheduleMeta } from "@/components/events/event-schedule-meta";
import { WaitlistDisplay } from "@/components/events/waitlist-display";
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal";
import {
  formatEventPriceDisplay,
  getBookingWindowClosedLabel,
  getEventCapacity,
  getEventLowestTicketPrice,
  getEventVenueDisplay,
  hasVenueTierMatrix,
  isBookingWindowOpen,
  isEventPaid,
} from "@/lib/event-display-price";

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

type EventTab = "upcoming" | "past" | "canceled";

type CanceledEventListItem = {
  id: string;
  title: string;
  startTime: string;
  venue: string;
  category: string;
  event?: Event;
};

const tabLabels: Record<EventTab, string> = {
  upcoming: "Upcoming events",
  past: "Past events",
  canceled: "Canceled events",
};

function EmptyEventsState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-64 items-center justify-center p-6">
        <div className="text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" strokeWidth={1.75} />
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="mt-1 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

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
  const { socket } = useSocket();
  const clubId = useRequiredClubId();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<EventTab>("upcoming");
  const [selectedEventForDetails, setSelectedEventForDetails] =
    useState<Event | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
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
  const [refundCancelAttendeeId, setRefundCancelAttendeeId] = useState<string | null>(null);
  const [refundEstimate, setRefundEstimate] = useState<any | null>(null);
  const [refundModalLoading, setRefundModalLoading] = useState(false);
  const [refundModalError, setRefundModalError] = useState<string | null>(null);
  const [attendeeSelectOpen, setAttendeeSelectOpen] = useState(false);
  const [attendeeSelectList, setAttendeeSelectList] = useState<CancellableAttendee[]>([]);
  const [attendeeSelectMode, setAttendeeSelectMode] = useState<'refund' | 'cancel'>('refund');
  const [pendingRefundEventId, setPendingRefundEventId] = useState<string | null>(null);
  const [showVenueTierCartModal, setShowVenueTierCartModal] = useState(false);
  const [venueTierEvent, setVenueTierEvent] = useState<Event | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserRegistrations();
    } else {
      setUserRegistrations(new Map());
    }
  }, [clubId]);

  useEffect(() => {
    if (!user) return;
    apiClient.getMyWaitlistStatus().then((res) => {
      if (res.success && res.data) setWaitlistStatus(res.data);
    });
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { eventId: string; is_refund_allowed: boolean }) => {
      setEvents((prev) =>
        prev.map((e) =>
          String(e._id) === String(payload.eventId)
            ? { ...e, is_refund_allowed: payload.is_refund_allowed, isRefundAllowed: payload.is_refund_allowed }
            : e
        )
      );
    };
    socket.on("event:refund-policy-updated", handler);
    return () => { socket.off("event:refund-policy-updated", handler); };
  }, [socket]);

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
        setEventForPayment({ ...ev, price: getEventLowestTicketPrice(ev) } as Event & { price: number });
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
      initiateRefundCancel(found._id, found);
    }
  }, [searchParams, events, loading]);

  const fetchUserRegistrations = async () => {
    if (!user) {
      setUserRegistrations(new Map());
      return;
    }
    try {
      const response = await apiClient.getUserEventRegistrations(clubId || undefined);
      if (response.success && response.data) {
        const registrationsMap = new Map<string, any>();
        response.data.forEach((reg: any) => {
          registrationsMap.set(String(reg.eventId), reg.registration);
        });
        setUserRegistrations(registrationsMap);
      }
    } catch {
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (!clubId) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const response = await apiClient.getPublicEvents(clubId, {
        includeHistory: true,
      });

      if (response.success && response.data) {
        const data: any = response.data;
        const eventsData = Array.isArray(data) ? data : (data?.events || []);
        const sortedEvents = [...eventsData].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setEvents(sortedEvents);
        if (user) {
          await fetchUserRegistrations();
        }
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

    setVenueTierEvent(event);
    setShowVenueTierCartModal(true);
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
    return getEventCapacity(event)
  };

  const isEventFull = (event: Event) => {
    const { count, max } = getCapacity(event);
    return max !== null ? count >= max : false;
  };

  const isEventMembersOnly = (event: Event) => {
    return (event.memberOnly ? user?.memberships?.map(a => a?.club_id?._id).includes(event.clubId || "null") || false : true)
  }

  const isEventPast = (event: Event, now = Date.now()) => {
    const eventEnd = event.endTime || event.startTime;
    return new Date(eventEnd).getTime() <= now;
  };

  const isEventOngoing = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    if (!event.endTime) return false;
    const end = new Date(event.endTime);
    return start <= now && now < end;
  };

  const eventsUserIsRegisteredForOngoing = () => {
    if (!user) return [] as Event[];
    return (events || []).filter(
      (ev) => isEventOngoing(ev) && isUserRegisteredForEvent(ev, user._id, userRegistrations)
    );
  };

  const handleCancelRegistration = async (eventId: string, attendeeId?: string) => {
    if (!eventId) return;
    try {
      setCancellingEventId(eventId);
      const res = await apiClient.cancelEventRegistration(eventId, attendeeId);
      if (res && res.success) {
        toast.success(res.data?.message || "Registration cancelled");
        await fetchEvents();
      } else {
        const data = res as any;
        if (data?.requiresAttendeeSelection || data?.data?.requiresAttendeeSelection) {
          const attendees = extractCancellableAttendeesFromApiResponse(data);
          if (attendees.length > 0) {
            setAttendeeSelectList(attendees);
            setAttendeeSelectMode('cancel');
            setPendingRefundEventId(eventId);
            setAttendeeSelectOpen(true);
            return;
          }
          const estimateRes = await apiClient.estimateRefund({ sourceType: 'event_ticket', eventId });
          const estimate = estimateRes.success && estimateRes.data
            ? ((estimateRes.data as any)?.data ?? estimateRes.data)
            : null;
          const estimateAttendees = estimate?.meta?.cancellableAttendees || [];
          if (estimateAttendees.length > 0) {
            setAttendeeSelectList(estimateAttendees);
            setAttendeeSelectMode('cancel');
            setPendingRefundEventId(eventId);
            setAttendeeSelectOpen(true);
            return;
          }
        }
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

  const runRefundEstimate = async (eventId: string, attendeeId?: string) => {
    const res = await apiClient.estimateRefund({ sourceType: 'event_ticket', eventId, attendeeId });
    if (res.success && res.data) {
      const rawData = res.data as any;
      const estimate = rawData?.data != null ? rawData.data : rawData;
      if (estimate.requiresAttendeeSelection) {
        const cancellable = estimate.meta?.cancellableAttendees || [];
        if (cancellable.length > 0) {
          setAttendeeSelectList(cancellable);
          setAttendeeSelectMode('refund');
          setPendingRefundEventId(eventId);
          setAttendeeSelectOpen(true);
          return;
        }
        toast.error('No cancellable tickets found for this registration');
        return;
      }
      if (!estimate.eligible) {
        toast.error('Refund is not available for this ticket under the current policy');
        return;
      }
      if (!estimate.breakdown?.grossPaid && estimate.estimatedRefund === 0) {
        await handleCancelRegistration(eventId, attendeeId || estimate.meta?.attendeeId);
        return;
      }
      setRefundEstimate(estimate);
      setRefundCancelEventId(eventId);
      setRefundCancelAttendeeId(estimate.meta?.attendeeId || attendeeId || null);
    } else {
      const msg = (res as any).error || (res as any).message || 'Failed to load refund estimate';
      toast.error(msg);
    }
  };

  const initiateRefundCancel = async (eventId: string, event?: Event) => {
    try {
      setRefundModalLoading(true);
      setRefundModalError(null);
      const isFree = event ? !isEventPaid(event) : false;
      if (isFree) {
        await handleCancelRegistration(eventId);
        return;
      }
      const policyRes = await apiClient.getEventRefundPolicy(eventId);
      const policy = policyRes.success && policyRes.data ? policyRes.data : null;
      if (policy?.event_cancelled) {
        toast.info("This event was cancelled by the club. Automatic refund processing applies.");
        return;
      }
      if (policy && isEventNonRefundable(policy)) {
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
      await runRefundEstimate(eventId);
    } catch {
      toast.error('Failed to fetch refund estimate');
    } finally {
      setRefundModalLoading(false);
    }
  };

  const handleAttendeeSelected = async (attendeeId: string) => {
    const eventId = pendingRefundEventId;
    if (!eventId) return;
    setAttendeeSelectOpen(false);
    setPendingRefundEventId(null);
    if (attendeeSelectMode === 'cancel') {
      await handleCancelRegistration(eventId, attendeeId);
      return;
    }
    try {
      setRefundModalLoading(true);
      await runRefundEstimate(eventId, attendeeId);
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
      const res = await apiClient.requestRefund({
        sourceType: 'event_ticket',
        eventId: refundCancelEventId,
        attendeeId: refundCancelAttendeeId || undefined,
      });
      if (res.success) {
        setRefundCancelEventId(null);
        setRefundCancelAttendeeId(null);
        setRefundEstimate(null);
        toast.success('Ticket cancelled. Refund will be processed in 5-7 working days.');
        await fetchEvents();
      } else {
        const msg = (res as any).message || (res as any).error || 'Failed to request refund';
        setRefundCancelEventId(null);
        setRefundCancelAttendeeId(null);
        setRefundEstimate(null);
        toast.error(msg);
      }
    } catch {
      setRefundCancelEventId(null);
      setRefundCancelAttendeeId(null);
      setRefundEstimate(null);
      toast.error('Failed to request refund');
    } finally {
      setRefundModalLoading(false);
    }
  };


  const filteredEvents = events.filter((event) => {
    const searchMatch =
      !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEventVenueDisplay(event).toLowerCase().includes(searchTerm.toLowerCase());

    const categoryMatch =
      categoryFilter === "all" || event.category === categoryFilter;

    return searchMatch && categoryMatch;
  });

  const isEventCanceled = (event: Event) =>
    Boolean(event.cancellation) || event.isActive === false;

  // Classify in one pass with one timestamp so an event can never appear in
  // more than one tab. Cancellation wins over dates, and an ongoing event stays
  // current/upcoming until its end time.
  const eventListNow = Date.now();
  const categorizedEvents = filteredEvents.reduce<{
    upcoming: Event[];
    past: Event[];
    canceled: Event[];
  }>((groups, event) => {
    if (!isEventMembersOnly(event)) return groups;

    if (isEventCanceled(event)) {
      groups.canceled.push(event);
    } else if (isEventPast(event, eventListNow)) {
      groups.past.push(event);
    } else {
      groups.upcoming.push(event);
    }
    return groups;
  }, { upcoming: [], past: [], canceled: [] });

  const upcomingEvents = categorizedEvents.upcoming;
  const pastEvents = categorizedEvents.past;

  const canceledEventItems: CanceledEventListItem[] = categorizedEvents.canceled
    .map((event) => ({
      id: String(event._id),
      title: event.title,
      startTime: event.startTime,
      venue: getEventVenueDisplay(event),
      category: event.category,
      event,
    }));

  const canceledEvents = Array.from(
    new Map(canceledEventItems.map((item) => [item.id, item])).values()
  ).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const activeTabCount = activeTab === "upcoming"
    ? upcomingEvents.length
    : activeTab === "past"
      ? pastEvents.length
      : canceledEvents.length;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Discover and register for upcoming events
            </p>
          </div>

          <Card className="shadow-none">
            <CardContent className="p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 pl-12 text-base"
                    />
                  </div>
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 w-full px-4 text-base sm:w-60">
                    <Filter className="mr-3 h-4 w-4" />
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
                                ticketPrice: getEventLowestTicketPrice(eventData as Event),
                                price: getEventLowestTicketPrice(eventData as Event),
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
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Ongoing events</h2>
              <p className="mb-3 text-base text-muted-foreground">
                Ongoing events that you've registered for
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsUserIsRegisteredForOngoing().length === 0 ? (
                  <Card className="shadow-none md:col-span-2 lg:col-span-3">
                    <CardContent className="flex min-h-40 items-center justify-center p-6">
                      <div className="max-w-sm text-center text-muted-foreground">
                        <CalendarX className="mx-auto mb-4 h-9 w-9" strokeWidth={1.75} />
                        <p className="text-base leading-snug">
                          No ongoing events that you're registered for right now.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  eventsUserIsRegisteredForOngoing().map((event) => (
                    <Card
                      key={event._id}
                      className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
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
                            <span>
                              {new Date(event.startTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{getEventVenueDisplay(event)}</span>
                          </div>
                        </div>
                        <div className="pt-2 mt-auto">
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
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Event status">
              {(Object.keys(tabLabels) as EventTab[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    variant="outline"
                    onClick={() => setActiveTab(tab)}
                    className={`h-10 rounded-full px-5 font-medium shadow-none ${
                      isActive && tab === "upcoming"
                        ? "border-[#42dc79] bg-[#42dc79] text-white hover:bg-[#35c96c] hover:text-white"
                        : isActive && tab === "past"
                          ? "border-[#b8cbb7] bg-[#b8cbb7] text-white hover:bg-[#aabda9] hover:text-white"
                          : isActive && tab === "canceled"
                            ? "border-[#f04c28] bg-[#f04c28] text-white hover:bg-[#dc4020] hover:text-white"
                            : "bg-background text-foreground hover:bg-muted"
                    }`}>
                    {tabLabels[tab]}
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {activeTab === "upcoming"
                  ? "Upcoming Events"
                  : activeTab === "past"
                    ? "Past Events"
                    : "Canceled Events"}
              </h2>
              <Badge variant="outline" className="rounded-full px-3 font-medium">
                {activeTabCount} events
              </Badge>
            </div>

            {activeTab === "upcoming" && (loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-muted border-b-primary"></div>
                  <p className="mt-4 text-muted-foreground">
                    Loading events...
                  </p>
                </div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <EmptyEventsState
                title="No upcoming events"
                description="Check back later for new events"
              />
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
                      className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
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
                            <Badge variant="secondary" className="block">
                              {event.category}
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
                            <span className="truncate">{getEventVenueDisplay(event)}</span>
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
                          {isEventPaid(event) && (() => {
                            const priceLabel = formatEventPriceDisplay(event, {
                              fromPrefix: hasVenueTierMatrix(event),
                            })
                            return priceLabel ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-primary">
                                  Price: {priceLabel}
                                </span>
                                {hasVenueTierMatrix(event) && (
                                  <Badge variant="outline" className="text-xs">Multi-venue</Badge>
                                )}
                              </div>
                            ) : null
                          })()}
                          <JointScreeningDisplay jointScreening={event.jointScreening} variant="badge" />
                          <WaitlistDisplay waitlist={event.waitlist} variant="badge" />
                          <EventScheduleMeta
                            bookingStartTime={event.bookingStartTime}
                            bookingEndTime={event.bookingEndTime}
                            attendancePoints={event.attendancePoints}
                          />
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

                        <div className="pt-2 mt-auto">
                          {(() => {
                            const hasConfirmed = isUserRegisteredForEvent(event, user?._id, userRegistrations);
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
                                    isFreeEvent={!isEventPaid(event)}
                                    onRequestRefund={() => initiateRefundCancel(event._id, event)}
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
                                            setEventForPayment({ ...event, price: getEventLowestTicketPrice(event) } as Event & { price: number });
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
                            } else if (!isBookingWindowOpen(event)) {
                              return (
                                <Button disabled className="w-full" variant="secondary">
                                  {getBookingWindowClosedLabel(event)}
                                </Button>
                              );
                            } else {
                              return (
                                <Button
                                  onClick={() =>
                                    handleEventRegistration(event._id)
                                  }
                                  className="w-full">
                                  {event.category === 'csr-events' ? 'Donate for Event' : 'Register for Event'}
                                </Button>
                              );
                            }
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ))}

          {activeTab === "past" && (
            pastEvents.length === 0 ? (
              <EmptyEventsState title="No past events" />
            ) : (
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
                      className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
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
                            <Badge variant="secondary" className="block">
                              {event.category}
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
                            <span>
                              {new Date(event.startTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{getEventVenueDisplay(event)}</span>
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
                        <div className="pt-2 mt-auto">
                          <Button variant="outline" className="w-full" disabled>
                            Event Ended
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )
          )}

          {activeTab === "canceled" && (
            canceledEvents.length === 0 ? (
              <EmptyEventsState title="No canceled events" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {canceledEvents.map((item) => (
                  <Card
                    key={item.id}
                    className="flex h-full flex-col overflow-hidden shadow-none transition-shadow hover:shadow-md">
                    {item.event ? (
                      <EventImage
                        eventId={item.event._id}
                        imageVersion={item.event.imageVersion}
                        size="list"
                        directUrl={eventVariantUrl(item.event, "list")}
                        alt={item.title}
                      />
                    ) : null}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="line-clamp-2 text-lg">
                          {item.title}
                        </CardTitle>
                        <Badge variant="destructive" className="shrink-0">
                          Canceled
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(item.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{item.venue}</span>
                        </div>
                      </div>
                      <Button variant="outline" className="mt-auto w-full" disabled>
                        Event Canceled
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
          </div>
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
              category: (eventForPayment as any).category,
              earlyBirdDiscount: (eventForPayment as any).earlyBirdDiscount,
              memberDiscount: (eventForPayment as any).memberDiscount,
              groupDiscount: (eventForPayment as any).groupDiscount,
              currency: (eventForPayment as any).currency,
              feeHandlingType: (eventForPayment as any).feeHandlingType,
              platformFeePercent: (eventForPayment as any).platformFeePercent,
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
        onCancellation={async () => {
          await fetchEvents();
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
            setRefundCancelAttendeeId(null);
            setRefundEstimate(null);
            setRefundModalError(null);
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
          setAttendeeSelectOpen(false);
          setPendingRefundEventId(null);
          setAttendeeSelectList([]);
        }}
      />
      <VenueTierCartModal
        isOpen={showVenueTierCartModal}
        onClose={() => { setShowVenueTierCartModal(false); setVenueTierEvent(null); }}
        event={venueTierEvent}
        onSuccess={() => {
          setShowVenueTierCartModal(false);
          setVenueTierEvent(null);
          fetchEvents();
          fetchUserRegistrations();
        }}
        onFailure={() => {
          setShowVenueTierCartModal(false);
        }}
        onCancellation={async () => {
          await fetchEvents();
          await fetchUserRegistrations();
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
