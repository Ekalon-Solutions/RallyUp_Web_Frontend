"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2, Tv2, Plus, X, Percent } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import { clubActionButtonClassName, clubActionButtonStyle } from "@/lib/clubThemeButton"
import { useDesignSettings } from "@/hooks/useDesignSettings"
import { useAuth } from "@/contexts/auth-context"
import { VenueTierMatrixBuilder, VenueDraft, TierDraft, createEmptyVenueDraft } from "@/components/admin/venue-tier-matrix-builder"

const CATEGORIES = [
  { value: "screenings", label: "Screenings" },
  { value: "footy-meets", label: "Footy Meets" },
  { value: "tournaments", label: "Tournaments" },
  { value: "auctions", label: "Auctions" },
  { value: "club-events", label: "Club Events" },
  { value: "social-events", label: "Social Events" },
  { value: "csr-events", label: "CSR Events" },
  { value: "watch-parties", label: "Watch Parties" },
  { value: "travel-days", label: "Travel Days" },
  { value: "workshops", label: "Workshops" },
  { value: "general-meeting", label: "General Meeting" },
  { value: "matchday", label: "Matchday" },
  { value: "others", label: "Others" },
]

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "BRL", "MXN", "ZAR"]

/** Convert an ISO string to the value format expected by datetime-local inputs */
function toDatetimeLocal(iso?: string): string {
  if (!iso) return ""
  try {
    return new Date(iso).toISOString().slice(0, 16)
  } catch {
    return ""
  }
}

function CreateEventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEditMode = Boolean(editId)

  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetchingEvent, setFetchingEvent] = useState(isEditMode)
  const [venues, setVenues] = useState<VenueDraft[]>([])

  const [form, setForm] = useState({
    title: "",
    category: "club-events",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
    maxAttendees: "",
    ticketPrice: "0",
    currency: "INR",
    requiresTicket: false,
    memberOnly: false,
    bookingStartTime: "",
    bookingEndTime: "",
    attendancePoints: "0",
    waitlistEnabled: false,
    waitlistPercentage: "25",
    waitlistPurchaseWindowHours: "12",
    jointScreeningEnabled: false,
    earlyBirdEnabled: false,
    earlyBirdType: "percentage",
    earlyBirdValue: "",
    earlyBirdStartTime: "",
    earlyBirdEndTime: "",
    earlyBirdMembersOnly: false,
    multiTicketEnabled: false,
  })
  const [partnerClubNames, setPartnerClubNames] = useState<string[]>([])
  const [newPartnerClub, setNewPartnerClub] = useState("")

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    setVenues((prev) => {
      if (prev.length === 0) return prev

      if (!form.jointScreeningEnabled) {
        return prev.map((v) => ({
          ...v,
          tiers: v.tiers.map((t) => ({ ...t, clubAllocations: undefined })),
        }))
      }

      if (partnerClubNames.length === 0) return prev

      return prev.map((v) => ({
        ...v,
        tiers: v.tiers.map((t) => {
          const existingMap = new Map((t.clubAllocations ?? []).map((ca) => [ca.clubName, ca.allocation]))
          const basePerClub = Math.max(1, Math.floor(t.allocation / partnerClubNames.length))
          const synced = partnerClubNames.map((name) => ({
            clubName: name,
            allocation: existingMap.has(name) ? existingMap.get(name)! : basePerClub,
          }))
          const total = Math.max(1, synced.reduce((s, ca) => s + ca.allocation, 0))
          return { ...t, clubAllocations: synced, allocation: total }
        }),
      }))
    })
  }, [form.jointScreeningEnabled, partnerClubNames])

  const clubId = (() => {
    const u = user as any
    return u?.club?._id ?? u?.club ?? ""
  })()

  const { primaryColor } = useDesignSettings(clubId)
  const clubBtnClass = clubActionButtonClassName()
  const clubBtnStyle = clubActionButtonStyle(primaryColor)
  
  useEffect(() => {
    if (!editId) return
    const fetchEvent = async () => {
      setFetchingEvent(true)
      try {
        const res = await apiClient.getEventById(editId)
        if (!res.success || !res.data) {
          toast.error("Failed to load event")
          router.push("/dashboard/events")
          return
        }
        const ev = res.data
        setForm({
          title: ev.title ?? "",
          category: ev.category ?? "club-events",
          startTime: toDatetimeLocal(ev.startTime),
          endTime: toDatetimeLocal(ev.endTime),
          venue: ev.venues?.length ? "" : (ev.venue ?? ""),
          description: ev.description ?? "",
          maxAttendees: ev.maxAttendees ? String(ev.maxAttendees) : "",
          ticketPrice: String(ev.ticketPrice ?? 0),
          currency: ev.currency ?? "INR",
          requiresTicket: ev.requiresTicket ?? false,
          memberOnly: ev.memberOnly ?? false,
          bookingStartTime: toDatetimeLocal(ev.bookingStartTime),
          bookingEndTime: toDatetimeLocal(ev.bookingEndTime),
          attendancePoints: String(ev.attendancePoints ?? 0),
          waitlistEnabled: ev.waitlist?.enabled ?? false,
          waitlistPercentage: String(ev.waitlist?.percentage ?? 25),
          waitlistPurchaseWindowHours: String(ev.waitlist?.purchaseWindowHours ?? 12),
          jointScreeningEnabled: ev.jointScreening?.enabled ?? false,
          earlyBirdEnabled: ev.earlyBirdDiscount?.enabled ?? false,
          earlyBirdType: ev.earlyBirdDiscount?.type ?? "percentage",
          earlyBirdValue: ev.earlyBirdDiscount?.value ? String(ev.earlyBirdDiscount.value) : "",
          earlyBirdStartTime: toDatetimeLocal(ev.earlyBirdDiscount?.startTime),
          earlyBirdEndTime: toDatetimeLocal(ev.earlyBirdDiscount?.endTime),
          earlyBirdMembersOnly: ev.earlyBirdDiscount?.membersOnly ?? false,
          multiTicketEnabled: Boolean(ev.venues?.length),
        })
        setPartnerClubNames(ev.jointScreening?.partnerClubNames ?? [])
        if (ev.venues?.length) {
          setVenues(
            ev.venues.map((v) => ({
              id: v._id,
              name: v.name,
              tiers: v.tiers.map((t): TierDraft => ({
                id: t._id,
                name: t.name,
                price: t.price,
                allocation: t.allocation,
                clubAllocations: t.clubAllocations?.map((ca) => ({
                  clubName: ca.clubName,
                  allocation: ca.allocation,
                })),
              })),
            }))
          )
        }
      } catch {
        toast.error("Error loading event")
        router.push("/dashboard/events")
      } finally {
        setFetchingEvent(false)
      }
    }
    fetchEvent()
  }, [editId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim()) { toast.error("Event title is required"); return }
    if (!form.startTime) { toast.error("Start time is required"); return }
    if (form.jointScreeningEnabled && partnerClubNames.length === 0) {
      toast.error("Add at least one partner club name for joint screening")
      return
    }
    if (form.multiTicketEnabled && venues.length === 0) {
      toast.error("Add at least one venue and ticket tier for multi-ticket events")
      return
    }
    if (!form.multiTicketEnabled && !form.venue.trim()) {
      toast.error("Venue is required")
      return
    }
    if (!form.bookingStartTime) { toast.error("Booking start time is required"); return }
    if (!form.bookingEndTime) { toast.error("Booking end time is required"); return }
    if (!form.description.trim()) { toast.error("Description is required"); return }

    if (form.multiTicketEnabled && venues.length > 0) {
      for (const v of venues) {
        if (!v.name.trim()) { toast.error("All venues must have a name"); return }
        for (const t of v.tiers) {
          if (!t.name.trim()) { toast.error(`All tiers in "${v.name}" must have a name`); return }
          if (t.allocation < 1) { toast.error(`Allocation for "${v.name} – ${t.name}" must be at least 1`); return }
        }
      }
    }

    if (form.earlyBirdEnabled) {
      const ebVal = Number(form.earlyBirdValue)
      if (!form.earlyBirdValue || ebVal <= 0) { toast.error("Early bird discount value must be greater than 0"); return }
      if (form.earlyBirdType === "percentage" && ebVal > 100) { toast.error("Percentage discount cannot exceed 100%"); return }
      if (form.earlyBirdType === "fixed" && ebVal > (Number(form.ticketPrice) || 0)) { toast.error("Fixed discount cannot exceed the ticket price"); return }
      if (!form.earlyBirdStartTime) { toast.error("Early bird start time is required"); return }
      if (!form.earlyBirdEndTime) { toast.error("Early bird end time is required"); return }
      const ebStart = new Date(form.earlyBirdStartTime)
      const ebEnd = new Date(form.earlyBirdEndTime)
      const eventStart = form.startTime ? new Date(form.startTime) : null
      if (eventStart && ebStart >= eventStart) { toast.error("Early bird start time must be before event start time"); return }
      if (ebEnd <= ebStart) { toast.error("Early bird end time must be after early bird start time"); return }
    }

    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        venue: form.venue.trim() || (venues[0]?.name ?? "Multiple Venues"),
        description: form.description.trim(),
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        ticketPrice: form.multiTicketEnabled ? 0 : Number(form.ticketPrice) || 0,
        currency: form.currency,
        requiresTicket: form.requiresTicket,
        memberOnly: form.memberOnly,
        bookingStartTime: new Date(form.bookingStartTime).toISOString(),
        bookingEndTime: new Date(form.bookingEndTime).toISOString(),
        attendancePoints: Number(form.attendancePoints) || 0,
        clubId: clubId || undefined,
        waitlist: form.waitlistEnabled
          ? {
              enabled: true,
              percentage: Number(form.waitlistPercentage) || 25,
              purchaseWindowHours: Number(form.waitlistPurchaseWindowHours) || 12,
            }
          : undefined,
        earlyBirdDiscount: form.earlyBirdEnabled ? {
          enabled: true,
          type: form.earlyBirdType as "percentage" | "fixed",
          value: Number(form.earlyBirdValue),
          startTime: new Date(form.earlyBirdStartTime).toISOString(),
          endTime: new Date(form.earlyBirdEndTime).toISOString(),
          membersOnly: form.earlyBirdMembersOnly,
        } : { enabled: false, type: "percentage" as const, value: 0 },
        jointScreening: {
          enabled: form.jointScreeningEnabled,
          partnerClubNames: form.jointScreeningEnabled ? partnerClubNames.filter(Boolean) : [],
        },
        venues: form.multiTicketEnabled && venues.length > 0
          ? venues.map((v) => ({
              name: v.name,
              tiers: v.tiers.map((t) => ({
                name: t.name,
                price: t.price,
                allocation: t.allocation,
                ...(t.clubAllocations?.length ? { clubAllocations: t.clubAllocations } : {}),
              })),
            }))
          : undefined,
      }

      if (isEditMode && editId) {
        const res = await apiClient.updateEvent(editId, payload)
        if (!res.success) {
          toast.error((res as any).message ?? res.error ?? "Failed to update event")
          return
        }
        toast.success("Event updated successfully!")
      } else {
        const res = await apiClient.createEvent(payload)
        if (!res.success) {
          toast.error((res as any).message ?? res.error ?? "Failed to create event")
          return
        }
        toast.success("Event created successfully!")
      }
      router.push("/dashboard/events")
    } catch (err: any) {
      toast.error(err?.message ?? "Error saving event")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingEvent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  const sectionBorder = "border-gray-300 dark:border-gray-600"
  const nestedBorder = "border-l-2 border-gray-300 dark:border-gray-600"
  const fieldBorder =
    "[&_input]:border-gray-300 [&_textarea]:border-gray-300 dark:[&_input]:border-gray-600 dark:[&_textarea]:border-gray-600 [&_.border-input]:border-gray-300 dark:[&_.border-input]:border-gray-600"

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-7xl pb-10 -mx-2 md:-mx-4 lg:-mx-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{isEditMode ? "Edit Event" : "Create Event"}</h1>
        </div>

        <form onSubmit={handleSubmit} className={cn("space-y-6", fieldBorder)}>
          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input id="startTime" type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the event"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv2 className="w-5 h-5" />
                Joint Screening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Joint Screening</Label>
                  <p className="text-xs text-muted-foreground">Partner with another club — fans select their affiliation at checkout</p>
                </div>
                <Switch
                  checked={form.jointScreeningEnabled}
                  onCheckedChange={(v) => set("jointScreeningEnabled", v)}
                />
              </div>

              {form.jointScreeningEnabled && (
                <div className={cn("space-y-4 pl-4", nestedBorder)}>
                  <div className="grid gap-2">
                    <Label>Partner Club Name</Label>
                    <p className="text-xs text-muted-foreground">
                      Each club gets its own seat allocation in the ticket matrix below
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter club name and press Enter"
                        value={newPartnerClub}
                        onChange={(e) => setNewPartnerClub(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const name = newPartnerClub.trim()
                            if (name && !partnerClubNames.includes(name)) {
                              setPartnerClubNames([...partnerClubNames, name])
                              setNewPartnerClub("")
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("shrink-0", clubBtnClass)}
                        style={clubBtnStyle}
                        onClick={() => {
                          const name = newPartnerClub.trim()
                          if (name && !partnerClubNames.includes(name)) {
                            setPartnerClubNames([...partnerClubNames, name])
                            setNewPartnerClub("")
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {partnerClubNames.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {partnerClubNames.map((club) => (
                          <span
                            key={club}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {club}
                            <button
                              type="button"
                              onClick={() => setPartnerClubNames(partnerClubNames.filter((c) => c !== club))}
                              className="hover:text-destructive transition-colors ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {partnerClubNames.length === 0 && (
                      <p className="text-xs text-amber-600">Add at least one partner club to enable club-wise seat allocation.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Venue & Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Multi-ticket event</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable venue x ticket-tier matrix allocation and multi-combo checkout.
                  </p>
                </div>
                <Switch
                  checked={form.multiTicketEnabled}
                  onCheckedChange={(v) => {
                    set("multiTicketEnabled", v)
                    if (!v) {
                      setVenues([])
                    } else {
                      setVenues((prev) =>
                        prev.length === 0
                          ? [
                              createEmptyVenueDraft(
                                form.jointScreeningEnabled
                                  ? { enabled: true, partnerClubNames }
                                  : undefined
                              ),
                            ]
                          : prev
                      )
                    }
                  }}
                />
              </div>

              {!form.multiTicketEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      placeholder="Enter venue name / address"
                      value={form.venue}
                      onChange={(e) => set("venue", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ticketPrice">Ticket Price</Label>
                      <Input
                        id="ticketPrice"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={form.ticketPrice}
                        onChange={(e) => set("ticketPrice", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxAttendees">Max Attendees</Label>
                      <Input
                        id="maxAttendees"
                        type="number"
                        min={1}
                        placeholder="Leave blank for unlimited"
                        value={form.maxAttendees}
                        onChange={(e) => set("maxAttendees", e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator className="bg-gray-300 dark:bg-gray-600" />
                </>
              )}

              {form.multiTicketEnabled && (
                <VenueTierMatrixBuilder
                  venues={venues}
                  onChange={setVenues}
                  currency={form.currency}
                  primaryColor={primaryColor}
                  cardClassName={sectionBorder}
                  jointScreening={
                    form.jointScreeningEnabled
                      ? { enabled: true, partnerClubNames }
                      : undefined
                  }
                />
              )}

              {form.multiTicketEnabled && venues.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Using multi-venue matrix — single ticket price and max attendees are managed per tier.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Booking Window</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bookingStartTime">Booking Opens *</Label>
                  <Input id="bookingStartTime" type="datetime-local" value={form.bookingStartTime} onChange={(e) => set("bookingStartTime", e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bookingEndTime">Booking Closes *</Label>
                  <Input id="bookingEndTime" type="datetime-local" value={form.bookingEndTime} onChange={(e) => set("bookingEndTime", e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Members Only</Label>
                  <p className="text-xs text-muted-foreground">Only club members can register</p>
                </div>
                <Switch checked={form.memberOnly} onCheckedChange={(v) => set("memberOnly", v)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attendancePoints">Attendance Points</Label>
                <Input
                  id="attendancePoints"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.attendancePoints}
                  onChange={(e) => set("attendancePoints", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Points awarded to members upon QR attendance scan</p>
                <p className="text-xs text-muted-foreground">For multi-ticket purchases, loyalty awarding is capped at 1x member value per transaction.</p>
              </div>

              <Separator className="bg-gray-300 dark:bg-gray-600" />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Waitlist</Label>
                  <p className="text-xs text-muted-foreground">Allow members to join a waitlist when event is full</p>
                </div>
                <Switch checked={form.waitlistEnabled} onCheckedChange={(v) => set("waitlistEnabled", v)} />
              </div>

              {form.waitlistEnabled && (
                <div className={cn("grid grid-cols-2 gap-4 pl-4", nestedBorder)}>
                  <div className="grid gap-2">
                    <Label>Waitlist Size (% of capacity)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={form.waitlistPercentage}
                      onChange={(e) => set("waitlistPercentage", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Purchase Window (hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      value={form.waitlistPurchaseWindowHours}
                      onChange={(e) => set("waitlistPurchaseWindowHours", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Early Bird Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Early Bird Discount</Label>
                  <p className="text-xs text-muted-foreground">Offer a time-limited discount before a cutoff date</p>
                </div>
                <Switch checked={form.earlyBirdEnabled} onCheckedChange={(v) => set("earlyBirdEnabled", v)} />
              </div>

              {form.earlyBirdEnabled && (
                <div className={cn("space-y-4 pl-4", nestedBorder)}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Discount Type</Label>
                      <Select value={form.earlyBirdType} onValueChange={(v) => set("earlyBirdType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="earlyBirdValue">
                        Discount Value {form.earlyBirdType === "percentage" ? "(%)" : `(${form.currency})`}
                      </Label>
                      <Input
                        id="earlyBirdValue"
                        type="number"
                        min={0}
                        placeholder={form.earlyBirdType === "percentage" ? "e.g. 10" : "e.g. 100"}
                        value={form.earlyBirdValue}
                        onChange={(e) => set("earlyBirdValue", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="earlyBirdStartTime">Discount Starts</Label>
                      <Input
                        id="earlyBirdStartTime"
                        type="datetime-local"
                        value={form.earlyBirdStartTime}
                        onChange={(e) => set("earlyBirdStartTime", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="earlyBirdEndTime">Discount Ends</Label>
                      <Input
                        id="earlyBirdEndTime"
                        type="datetime-local"
                        value={form.earlyBirdEndTime}
                        onChange={(e) => set("earlyBirdEndTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Members Only</Label>
                      <p className="text-xs text-muted-foreground">Restrict this discount to club members</p>
                    </div>
                    <Switch
                      checked={form.earlyBirdMembersOnly}
                      onCheckedChange={(v) => set("earlyBirdMembersOnly", v)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/events">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="ghost"
              disabled={loading}
              className={clubBtnClass}
              style={clubBtnStyle}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? "Save Changes" : "Create Event"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    }>
      <CreateEventForm />
    </Suspense>
  )
}
