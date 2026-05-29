"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient, Event } from "@/lib/api"
import { formatDisplayDate, slugify } from "@/lib/utils"
import UserEventRegistrationModal from "@/components/modals/user-event-registration-modal"
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal"
import {
  PurchaseFlowModal,
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
} from "lucide-react"
import Link from "next/link"

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

  const [showEventRegistrationModal, setShowEventRegistrationModal] = useState(false)
  const [showPurchaseFlowModal, setShowPurchaseFlowModal] = useState(false)
  const [showEventCheckoutModal, setShowEventCheckoutModal] = useState(false)
  const [eventCheckoutAsGuest, setEventCheckoutAsGuest] = useState(false)
  const [attendeesForPayment, setAttendeesForPayment] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [slug, eventSlug])

  // Resume purchase after login/register redirect
  useEffect(() => {
    const resume = searchParams.get("resumePurchase")
    if (resume !== "1" || !club?._id || !event) return
    const intent = getStoredPurchaseIntent()
    if (!intent || intent.type !== "event" || intent.clubId !== club._id || intent.eventId !== event._id) return

    const storedAttendees = intent.attendees || []

    const finish = () => {
      setAttendeesForPayment(storedAttendees)
      setShowEventCheckoutModal(true)
      clearStoredPurchaseIntent()
      const url = new URL(window.location.href)
      url.searchParams.delete("resumePurchase")
      window.history.replaceState({}, "", url.pathname + url.search)
    }

    apiClient.checkEventRegistration(event._id).then((checkResult) => {
      if (checkResult.success && checkResult.data) {
        const { isRegistered, isMember } = checkResult.data
        if (isMember && isRegistered) {
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
          const found = eventsRes.data.find((e) => slugify(e.title) === eventSlug)
          if (found) setEvent(found)
        }
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleBuyTickets = async () => {
    if (!event) return
    const isEventFull = event.maxAttendees != null && (event.currentAttendees ?? 0) >= event.maxAttendees
    if (isEventFull) return

    try {
      const checkResult = await apiClient.checkEventRegistration(event._id)
      if (checkResult.success && checkResult.data) {
        const { isRegistered, isMember } = checkResult.data
        if (isMember && isRegistered) {
          toast.error("You are already registered for this event")
          return
        }
      }
    } catch {}

    setShowEventRegistrationModal(true)
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

  const isEventFull = event.maxAttendees != null && (event.currentAttendees ?? 0) >= event.maxAttendees
  const isPaid = event.ticketPrice != null && event.ticketPrice > 0
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

        <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
          {/* Main content */}
          <div className="min-w-0 space-y-6 sm:space-y-8 order-2 lg:order-1">
            {/* Title & badges */}
            <header className="space-y-4 sm:space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {event.isActive !== undefined && (
                  <Badge variant={event.isActive ? "default" : "secondary"}>
                    {event.isActive ? "Active" : "Inactive"}
                  </Badge>
                )}
                {event.category && (
                  <Badge variant="outline">{event.category}</Badge>
                )}
                {isPaid && (
                  <Badge variant="outline" className="font-bold">
                    ₹{event.ticketPrice} (+ Fees)
                  </Badge>
                )}
                {!isPaid && (
                  <Badge variant="outline" className="text-green-600 border-green-400">
                    Free
                  </Badge>
                )}
              </div>
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
          </div>

          {/* Sidebar */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-[4.5rem]">
            <Card className="border-2 shadow-md overflow-hidden">
              <CardContent className="p-5 sm:p-6 lg:p-7 space-y-6">
                {/* Date */}
                <div className="space-y-5 sm:space-y-6">
                  {(event.eventDate || event.startTime) && (
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                      >
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Date</p>
                        <p className="font-semibold mt-1 leading-snug">
                          {formatDisplayDate(event.eventDate || event.startTime)}
                        </p>
                      </div>
                    </div>
                  )}

                  {(event.eventTime || event.startTime) && (
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                      >
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Time</p>
                        <p className="font-semibold mt-1 leading-snug">
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
                        </p>
                      </div>
                    </div>
                  )}

                  {event.venue && (
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                      >
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Venue</p>
                        <p className="font-semibold mt-1 leading-snug break-words">{event.venue}</p>
                      </div>
                    </div>
                  )}

                  {event.maxAttendees != null && (
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                      >
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Capacity</p>
                        <p className="font-semibold mt-1 leading-snug">
                          {event.currentAttendees ?? 0} / {event.maxAttendees} registered
                        </p>
                      </div>
                    </div>
                  )}

                  {isPaid && (
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                      >
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ticket Price</p>
                        <p className="text-2xl font-black mt-1 leading-none" style={{ color: primaryColor }}>
                          ₹{event.ticketPrice}{" "}
                          <span className="text-base font-semibold text-muted-foreground">(+ Fees)</span>
                        </p>
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
                  {isEventFull ? "Event Full" : isPaid ? "Buy Tickets" : "Register Now"}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Modals */}
      <UserEventRegistrationModal
        eventId={event._id}
        isOpen={showEventRegistrationModal}
        onClose={() => setShowEventRegistrationModal(false)}
        ticketPrice={event.ticketPrice || 0}
        event={event}
        onRegister={(payload) => {
          setAttendeesForPayment(payload.attendees || [])
          setShowEventRegistrationModal(false)
          setShowPurchaseFlowModal(true)
        }}
      />

      {club._id && (
        <PurchaseFlowModal
          isOpen={showPurchaseFlowModal}
          onClose={() => setShowPurchaseFlowModal(false)}
          clubId={club._id}
          clubName={club.name}
          returnPath={returnPath}
          onContinueToPayment={() => {
            setShowPurchaseFlowModal(false)
            setEventCheckoutAsGuest(true)
            setShowEventCheckoutModal(true)
          }}
          onLogin={(returnUrl) => {
            setStoredPurchaseIntent({
              type: "event",
              clubId: club._id,
              slug,
              eventId: event._id,
              event,
              attendees: attendeesForPayment,
              returnPath: returnUrl,
            })
            router.push(`/login?next=${encodeURIComponent(returnUrl)}`)
          }}
          onRegister={(registerNextUrl) => {
            setStoredPurchaseIntent({
              type: "event",
              clubId: club._id,
              slug,
              eventId: event._id,
              event,
              attendees: attendeesForPayment,
              returnPath: registerNextUrl,
            })
            router.push(registerNextUrl)
          }}
        />
      )}

      <EventCheckoutModal
        isOpen={showEventCheckoutModal}
        onClose={() => {
          setShowEventCheckoutModal(false)
          setEventCheckoutAsGuest(false)
          setAttendeesForPayment([])
        }}
        skipMemberValidation={eventCheckoutAsGuest}
        event={{
          _id: event._id,
          name: event.title,
          price: event.ticketPrice || 0,
          ticketPrice: event.ticketPrice || 0,
          earlyBirdDiscount: (event as any).earlyBirdDiscount,
          memberDiscount: (event as any).memberDiscount,
          groupDiscount: (event as any).groupDiscount,
          currency: (event as any).currency || "INR",
        }}
        attendees={attendeesForPayment}
        onSuccess={() => {
          loadData()
        }}
        onFailure={() => {}}
      />
    </div>
  )
}
