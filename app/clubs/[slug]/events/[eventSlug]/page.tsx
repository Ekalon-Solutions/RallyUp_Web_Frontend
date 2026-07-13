"use client"

import { useState, useEffect, type ComponentType, type ReactNode } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient, Event } from "@/lib/api"
import { EventImage } from "@/components/events/event-image"
import { eventVariantUrl } from "@/lib/eventImageCache"
import { formatDisplayDate, slugify } from "@/lib/utils"
import {
  setStoredPurchaseIntent,
  getStoredPurchaseIntent,
  clearStoredPurchaseIntent,
} from "@/components/modals/purchase-flow-modal"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Home,
  CalendarClock,
  Award,
} from "lucide-react"
import Link from "next/link"
import {
  formatEventPriceDisplay,
  formatTierPrice,
  getEventBuyCtaLabel,
  getEventCapacity,
  getEventTicketRows,
  getEventVenueDisplay,
  hasVenueTierMatrix,
  isEventPaid,
  normalizeEventVenues,
} from "@/lib/event-display-price"
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal"
import { RefundPolicyBadge } from "@/components/refund-policy-badge"
import { JointScreeningDisplay } from "@/components/events/joint-screening-display"
import { useSocket } from "@/contexts/socket-context"
import { formatBookingWindow } from "@/components/events/event-schedule-meta"
import { WaitlistDisplay } from "@/components/events/waitlist-display"

// Consistent icon + title + value row used throughout the sidebar card.
function InfoRow({
  icon: Icon,
  label,
  primaryColor,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  primaryColor: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3.5 sm:gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-semibold mt-1 leading-snug break-words">{children}</p>
      </div>
    </div>
  )
}

interface ClubSettings {
  websiteSetup: {
    title: string
    isPublished: boolean
  }
  designSettings: {
    primaryColor: string
    logo: string | null
  }
}

interface Club {
  _id: string
  name: string
  logo?: string
}

function isActivelyRegistered(data: {
  isRegistered?: boolean
  registrationStatus?: string
  status?: string
  registration?: { status?: string }
}) {
  const regStatus = (data.registrationStatus || data.status || data.registration?.status || '').toLowerCase()
  if (!regStatus) return Boolean(data.isRegistered)
  if (regStatus === 'pending' || ['cancelled', 'canceled', 'refunded'].includes(regStatus)) return false
  return regStatus === 'confirmed' || Boolean(data.isRegistered)
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const eventSlug = params.eventSlug as string

  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [event, setEvent] = useState<Event | null>(null)

  const [showVenueTierCartModal, setShowVenueTierCartModal] = useState(false)

  const { socket } = useSocket()

  useEffect(() => {
    loadData()
  }, [slug, eventSlug])

  // Sync refund policy in real-time when admin changes it mid-event
  useEffect(() => {
    if (!socket || !event?._id) return
    const handler = (payload: { eventId: string; is_refund_allowed: boolean }) => {
      if (String(payload.eventId) !== String(event._id)) return
      setEvent((prev) =>
        prev
          ? { ...prev, isRefundAllowed: payload.is_refund_allowed, is_refund_allowed: payload.is_refund_allowed }
          : prev
      )
    }
    socket.on("event:refund-policy-updated", handler)
    return () => { socket.off("event:refund-policy-updated", handler) }
  }, [socket, event?._id])

  // Resume purchase after login/register redirect
  useEffect(() => {
    const resume = searchParams.get("resumePurchase")
    if (resume !== "1" || !club?._id || !event) return
    const intent = getStoredPurchaseIntent()
    if (!intent || intent.type !== "event" || intent.clubId !== club._id || intent.eventId !== event._id) return

    const finish = () => {
      setShowVenueTierCartModal(true)
      clearStoredPurchaseIntent()
      const url = new URL(window.location.href)
      url.searchParams.delete("resumePurchase")
      window.history.replaceState({}, "", url.pathname + url.search)
    }

    apiClient.checkEventRegistration(event._id).then((checkResult) => {
      if (checkResult.success && checkResult.data) {
        const { isMember, ...registrationCheck } = checkResult.data as any
        if (isMember && isActivelyRegistered(registrationCheck)) {
          toast.error("You are already registered for this event")
          clearStoredPurchaseIntent()
          const url = new URL(window.location.href)
          url.searchParams.delete("resumePurchase")
          window.history.replaceState({}, "", url.pathname + url.search)
          return
        }
      }
      finish()
    }).catch(finish)
  }, [searchParams, club?._id, event])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clubRes, settingsRes] = await Promise.all([
        apiClient.getClubById(slug, true),
        apiClient.getClubSettings(slug, true),
      ])

      if (clubRes.success && clubRes.data) setClub(clubRes.data)
      if (settingsRes.success && settingsRes.data) {
        const actual = settingsRes.data.data || settingsRes.data
        setSettings(actual)
      }

      if (clubRes.success && clubRes.data) {
        const eventsRes = await apiClient.getPublicEvents(clubRes.data._id)
        if (eventsRes.success && eventsRes.data) {
          const raw = eventsRes.data as Event[] | { events?: Event[] }
          const eventsList = Array.isArray(raw) ? raw : raw.events ?? []
          const found = eventsList.find((e) => slugify(e.title) === eventSlug)
          if (found?._id) {
            const fullRes = await apiClient.getPublicEventById(found._id)
            const loaded = fullRes.success && fullRes.data ? fullRes.data : found
            setEvent(normalizeEventVenues(loaded))
          }
        }
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleBuyTickets = async () => {
    if (!event) return
    const { count, max } = getEventCapacity(event)
    const isFull = max != null && count >= max
    if (isFull) return

    try {
      const checkResult = await apiClient.checkEventRegistration(event._id)
      if (checkResult.success && checkResult.data) {
        const { isMember, ...registrationCheck } = checkResult.data as any
        if (isMember && isActivelyRegistered(registrationCheck)) {
          toast.error("You are already registered for this event")
          return
        }
      }
    } catch {}

    setShowVenueTierCartModal(true)
  }

  const primaryColor = settings?.designSettings?.primaryColor || "#3b82f6"
  const title = settings?.websiteSetup?.title || club?.name || ""
  const logo = settings?.designSettings?.logo || club?.logo

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!event || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="text-center space-y-6 max-w-md">
          <p className="text-xl font-semibold text-muted-foreground">Event not found.</p>
          <Button variant="outline" className="px-6" onClick={() => router.push(`/clubs/${slug}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Club
          </Button>
        </div>
      </div>
    )
  }

  const { count: capacityCount, max: capacityMax } = getEventCapacity(event)
  const isEventFull = capacityMax != null && capacityCount >= capacityMax
  const isPaid = isEventPaid(event)
  const multiVenue = hasVenueTierMatrix(event)
  const venueDisplay = getEventVenueDisplay(event)
  const ticketRows = getEventTicketRows(event)
  const displayPrice = formatEventPriceDisplay(event, {
    fromPrefix: multiVenue,
    includeFees: true,
  })
  const bookingWindow = formatBookingWindow(event.bookingStartTime, event.bookingEndTime)
  const rewardPointsNum = Number(event.attendancePoints)
  const rewardPoints = Number.isFinite(rewardPointsNum) && rewardPointsNum > 0 ? rewardPointsNum : null
  const returnPath = `/clubs/${slug}/events/${eventSlug}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {logo && (
              <img src={logo} alt={title} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 object-contain rounded-lg" />
            )}
            <span className="font-black text-base sm:text-lg tracking-tight truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/clubs/${slug}`)}
              className="font-semibold px-3 sm:px-4"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-6 sm:mb-10"
        >
          <Link href="/" className="inline-flex items-center hover:text-foreground transition-colors shrink-0">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-muted-foreground/60" aria-hidden>/</span>
          <Link href={`/clubs/${slug}`} className="hover:text-foreground transition-colors truncate max-w-[40vw] sm:max-w-none">
            {title}
          </Link>
          <span className="text-muted-foreground/60" aria-hidden>/</span>
          <span className="text-foreground font-medium truncate min-w-0">{event.title}</span>
        </nav>

        {/* Full-width 1080px hero banner — lazy-loaded + cached */}
        <EventImage
          eventId={event._id}
          imageVersion={event.imageVersion}
          size="full"
          priority
          directUrl={eventVariantUrl(event, "full")}
          primaryColor={primaryColor}
          alt={event.title}
          aspectClassName="aspect-[16/9] sm:aspect-[21/9]"
          className="mb-8 sm:mb-10 rounded-2xl border shadow-sm"
        />

        <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
          {/* Main content */}
          <div className="min-w-0 space-y-6 sm:space-y-8 order-2 lg:order-1">
            {/* Title */}
            <header>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.15] text-balance">
                {event.title}
              </h1>
            </header>

            <Separator className="my-2 sm:my-0" />

            {/* Description */}
            {event.description ? (
              <section className="rounded-2xl border border-border/80 bg-muted/25 px-5 py-6 sm:px-7 sm:py-8 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  About this event
                </h2>
                <p className="text-base sm:text-[1.0625rem] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </section>
            ) : null}

            {ticketRows.length > 0 && (multiVenue || isPaid) && (
              <section className="rounded-2xl border border-border/80 bg-muted/25 px-5 py-6 sm:px-7 sm:py-8 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Tickets
                </h2>
                <ul className="space-y-2">
                  {ticketRows.map((row, i) => (
                    <li
                      key={`${row.venue}-${row.tier}-${i}`}
                      className="flex items-start justify-between gap-3 rounded-lg bg-background/80 border border-border/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        {multiVenue && (event.venues?.length ?? 0) > 1 && (
                          <p className="text-xs text-muted-foreground">{row.venue}</p>
                        )}
                        <p className="font-semibold">{row.tier}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold" style={{ color: primaryColor }}>
                          {formatTierPrice(row.price, event.currency)}
                        </p>
                        {row.seats != null && row.seats > 0 && (
                          <p className="text-xs text-muted-foreground">{row.seats} seats</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-[4.5rem]">
            <Card className="border-2 shadow-md overflow-hidden">
              <CardContent className="p-5 sm:p-6 lg:p-7 space-y-6">
                <div className="space-y-5 sm:space-y-6">
                  {(event.eventDate || event.startTime) && (
                    <InfoRow icon={Calendar} label="Date" primaryColor={primaryColor}>
                      {formatDisplayDate(event.eventDate || event.startTime)}
                    </InfoRow>
                  )}

                  {(event.eventTime || event.startTime) && (
                    <InfoRow icon={Clock} label="Time" primaryColor={primaryColor}>
                      {event.eventTime ||
                        new Date(event.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      {event.endTime && (
                        <span>
                          {" "}– {new Date(event.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </InfoRow>
                  )}

                  {venueDisplay !== "—" && (
                    <InfoRow
                      icon={MapPin}
                      label={multiVenue && (event.venues?.length ?? 0) > 1 ? "Venues" : "Venue"}
                      primaryColor={primaryColor}
                    >
                      {venueDisplay}
                    </InfoRow>
                  )}

                  <JointScreeningDisplay
                    jointScreening={event.jointScreening}
                    variant="detail"
                    className="mx-0"
                  />

                  {bookingWindow && (
                    <InfoRow icon={CalendarClock} label="Booking window" primaryColor={primaryColor}>
                      {bookingWindow}
                    </InfoRow>
                  )}

                  {rewardPoints != null && (
                    <InfoRow icon={Award} label="Reward Points" primaryColor={primaryColor}>
                      {rewardPoints} <span className="text-muted-foreground">(Member Only)</span>
                    </InfoRow>
                  )}

                  <WaitlistDisplay
                    waitlist={event.waitlist}
                    variant="row"
                    primaryColor={primaryColor}
                    className="px-0.5"
                  />

                  {capacityMax != null && (
                    <InfoRow icon={Users} label="Capacity" primaryColor={primaryColor}>
                      {capacityCount} / {capacityMax} registered
                    </InfoRow>
                  )}

                  {isPaid && (
                    <div className="space-y-2">
                      <InfoRow icon={Ticket} label="Ticket Price" primaryColor={primaryColor}>
                        {displayPrice}
                      </InfoRow>
                      <div className="pl-[3.625rem]">
                        <RefundPolicyBadge eventId={event._id} source="event_detail" />
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-1" />

                <Button
                  className="w-full h-12 sm:h-[3.25rem] text-base font-bold rounded-xl mt-1"
                  style={isEventFull ? undefined : { backgroundColor: primaryColor, color: "white" }}
                  variant={isEventFull ? "secondary" : "default"}
                  disabled={isEventFull}
                  onClick={handleBuyTickets}
                >
                  {isEventFull ? "Event Full" : isPaid ? getEventBuyCtaLabel(event) : "Register Now"}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Modals — mount only when open to avoid render crashes from partial event payloads */}
      {showVenueTierCartModal && (
      <VenueTierCartModal
        isOpen={showVenueTierCartModal}
        onClose={() => setShowVenueTierCartModal(false)}
        event={event}
        onSuccess={() => {
          setShowVenueTierCartModal(false)
          loadData()
        }}
        onFailure={() => {}}
        onLogin={(guest) => {
          if (!club._id) return
          setShowVenueTierCartModal(false)
          const loginReturnUrl = returnPath + (returnPath.includes("?") ? "&" : "?") + "resumePurchase=1"
          setStoredPurchaseIntent({
            type: "event",
            clubId: club._id,
            slug,
            eventId: event._id,
            event,
            attendees: [{ name: guest.name, phone: `${guest.countryCode}${guest.phone}` }],
            returnPath: loginReturnUrl,
          })
          router.push(`/login?next=${encodeURIComponent(loginReturnUrl)}`)
        }}
        onSignup={(guest) => {
          if (!club._id) return
          setShowVenueTierCartModal(false)
          const signupReturnUrl = returnPath + (returnPath.includes("?") ? "&" : "?") + "resumePurchase=1"
          setStoredPurchaseIntent({
            type: "event",
            clubId: club._id,
            slug,
            eventId: event._id,
            event,
            attendees: [{ name: guest.name, phone: `${guest.countryCode}${guest.phone}` }],
            returnPath: signupReturnUrl,
          })
          router.push(`/login?tab=user-register&next=${encodeURIComponent(signupReturnUrl)}`)
        }}
      />
      )}
    </div>
  )
}
