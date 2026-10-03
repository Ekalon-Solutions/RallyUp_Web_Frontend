"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Ticket } from "lucide-react"
import { formatLocalDate } from "@/lib/timezone"

export interface MemberTicketOrder {
  eventId: string
  eventTitle: string
  eventStartTime?: string
  eventVenue?: string
  eventCategory?: string
  registration: {
    _id?: string
    registrationId?: string
    registrationDate?: string
    status?: string
    attendees?: Array<{
      _id?: string
      status?: string
      refundStatus?: string
    }>
    amountPaid?: number
    currency?: string
  }
}

interface TicketOrderHistoryProps {
  rows: MemberTicketOrder[]
  loading: boolean
  hasSearch: boolean
}

function ticketCount(row: MemberTicketOrder) {
  const attendees = row.registration?.attendees
  if (!Array.isArray(attendees) || attendees.length === 0) return 1
  return attendees.filter(
    (attendee) => attendee.status !== "cancelled" && attendee.status !== "refunded"
  ).length
}

function statusDetails(status = "confirmed") {
  const normalized = status.toLowerCase()
  if (normalized === "cancelled") {
    return { label: "Cancelled", className: "bg-red-100 text-red-800 hover:bg-red-100" }
  }
  if (normalized === "pending") {
    return { label: "Pending", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" }
  }
  if (normalized === "partially_cancelled") {
    return { label: "Partially cancelled", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" }
  }
  return { label: "Confirmed", className: "bg-green-100 text-green-800 hover:bg-green-100" }
}

export function TicketOrderHistory({ rows, loading, hasSearch }: TicketOrderHistoryProps) {
  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center" aria-label="Loading ticket orders">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
        <Ticket className="mb-5 h-12 w-12 text-muted-foreground" strokeWidth={1.8} />
        <h3 className="text-xl font-semibold text-foreground">No ticket orders found</h3>
        <p className="mt-1 text-muted-foreground">
          {hasSearch ? "No ticket orders match your search." : "You haven't booked any tickets yet."}
        </p>
        {!hasSearch && (
          <Button asChild className="mt-5">
            <Link href="/dashboard/user/events">Browse Events</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const registration = row.registration || {}
        const status = statusDetails(registration.status)
        const count = ticketCount(row)
        const key = registration.registrationId || registration._id || `${row.eventId}-${index}`

        return (
          <article key={key} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-muted p-2.5">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-foreground">
                      {row.eventTitle || "Event ticket"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {count} {count === 1 ? "ticket" : "tickets"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {row.eventStartTime && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span>{formatLocalDate(row.eventStartTime, "long")}</span>
                    </div>
                  )}
                  {row.eventVenue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{row.eventVenue}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <Badge className={status.className}>{status.label}</Badge>
                {row.eventId && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/user/events?eventId=${encodeURIComponent(row.eventId)}`}>
                      View Event
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
