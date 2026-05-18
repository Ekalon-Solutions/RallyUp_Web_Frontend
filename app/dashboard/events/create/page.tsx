"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { VenueTierMatrixBuilder, VenueDraft } from "@/components/admin/venue-tier-matrix-builder"

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

export default function CreateEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
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
  })

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const clubId = (() => {
    const u = user as any
    return u?.club?._id ?? u?.club ?? ""
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim()) { toast.error("Event title is required"); return }
    if (!form.startTime) { toast.error("Start time is required"); return }
    if (!form.venue.trim() && venues.length === 0) { toast.error("Venue or venue matrix is required"); return }
    if (!form.bookingStartTime) { toast.error("Booking start time is required"); return }
    if (!form.bookingEndTime) { toast.error("Booking end time is required"); return }
    if (!form.description.trim()) { toast.error("Description is required"); return }

    // Validate matrix entries if present
    if (venues.length > 0) {
      for (const v of venues) {
        if (!v.name.trim()) { toast.error("All venues must have a name"); return }
        for (const t of v.tiers) {
          if (!t.name.trim()) { toast.error(`All tiers in "${v.name}" must have a name`); return }
          if (t.allocation < 1) { toast.error(`Allocation for "${v.name} – ${t.name}" must be at least 1`); return }
        }
      }
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
        ticketPrice: venues.length > 0 ? 0 : Number(form.ticketPrice) || 0,
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
        venues: venues.length > 0
          ? venues.map((v) => ({
              name: v.name,
              tiers: v.tiers.map((t) => ({ name: t.name, price: t.price, allocation: t.allocation })),
            }))
          : undefined,
      }

      const res = await apiClient.createEvent(payload)
      if (!res.success) {
        toast.error((res as any).message ?? res.error ?? "Failed to create event")
        return
      }
      toast.success("Event created successfully!")
      router.push("/dashboard/events")
    } catch (err: any) {
      toast.error(err?.message ?? "Error creating event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card>
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

          {/* Venue & Ticket Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Venue & Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {venues.length === 0 && (
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

                  <Separator />
                </>
              )}

              <VenueTierMatrixBuilder
                venues={venues}
                onChange={setVenues}
                currency={form.currency}
              />

              {venues.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Using multi-venue matrix — single ticket price and max attendees are managed per tier.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Booking Window */}
          <Card>
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

          {/* Settings */}
          <Card>
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
              <div className="flex items-center justify-between">
                <div>
                  <Label>Requires Ticket</Label>
                  <p className="text-xs text-muted-foreground">Payment required to confirm registration</p>
                </div>
                <Switch checked={form.requiresTicket} onCheckedChange={(v) => set("requiresTicket", v)} />
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
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Waitlist</Label>
                  <p className="text-xs text-muted-foreground">Allow members to join a waitlist when event is full</p>
                </div>
                <Switch checked={form.waitlistEnabled} onCheckedChange={(v) => set("waitlistEnabled", v)} />
              </div>

              {form.waitlistEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
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

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/events">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
