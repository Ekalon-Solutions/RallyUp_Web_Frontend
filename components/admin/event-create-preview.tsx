"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { NonRefundableBadge } from "@/components/member/non-refundable-badge"
import type { VenueDraft } from "@/components/admin/venue-tier-matrix-builder"
import { formatDisplayDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Eye, MapPin, Ticket, Users } from "lucide-react"

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "CA$",
  JPY: "¥",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
}

type Props = {
  title: string
  category: string
  categoryLabel?: string
  startTime: string
  endTime: string
  description: string
  venue: string
  ticketPrice: string
  maxAttendees: string
  currency: string
  multiTicketEnabled: boolean
  venues: VenueDraft[]
  memberOnly: boolean
  isPaid: boolean
  isRefundAllowed: boolean
  primaryColor?: string
  clubName?: string
  className?: string
}

function formatTimeRange(startTime: string, endTime: string): string {
  if (!startTime) return "—"
  try {
    const start = new Date(startTime)
    const startLabel = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    if (!endTime) return startLabel
    const end = new Date(endTime)
    const endLabel = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    return `${startLabel} – ${endLabel}`
  } catch {
    return "—"
  }
}

function formatPrice(amount: number, sym: string): string {
  if (amount <= 0) return "Free"
  return `${sym}${amount.toLocaleString()} (+ Fees)`
}

export function EventCreatePreview({
  title,
  category,
  categoryLabel,
  startTime,
  endTime,
  description,
  venue,
  ticketPrice,
  maxAttendees,
  currency,
  multiTicketEnabled,
  venues,
  memberOnly,
  isPaid,
  isRefundAllowed,
  primaryColor = "#3b82f6",
  clubName,
  className,
}: Props) {
  const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `
  const displayTitle = title.trim() || "Event title"
  const displayCategory = categoryLabel ?? category.replace(/-/g, " ")

  const ticketRows = multiTicketEnabled
    ? venues.flatMap((v) =>
        v.tiers.map((t) => ({
          venue: v.name.trim() || "Venue",
          tier: t.name.trim() || "Tier",
          price: t.price,
          seats: t.allocation,
        }))
      )
    : [
        {
          venue: venue.trim() || "Venue",
          tier: "General",
          price: Number(ticketPrice) || 0,
          seats: maxAttendees.trim() ? Number(maxAttendees) : null,
        },
      ]

  const totalSeats = ticketRows.reduce((sum, row) => sum + (row.seats ?? 0), 0)
  const lowestPrice = ticketRows.length
    ? Math.min(...ticketRows.map((r) => r.price))
    : Number(ticketPrice) || 0

  return (
    <Card className={cn("border-2 shadow-sm overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          Event Preview
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How members will see this event{clubName ? ` on ${clubName}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs capitalize">
              {displayCategory}
            </Badge>
            {memberOnly && (
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200">
                Members only
              </Badge>
            )}
            {!isPaid ? (
              <Badge variant="outline" className="text-xs text-green-600 border-green-400">
                Free
              </Badge>
            ) : multiTicketEnabled && ticketRows.length > 1 ? (
              <Badge variant="outline" className="text-xs font-semibold">
                From {formatPrice(lowestPrice, sym)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-semibold">
                {formatPrice(lowestPrice, sym)}
              </Badge>
            )}
          </div>
          <h3 className={cn("text-lg font-bold leading-snug", !title.trim() && "text-muted-foreground")}>
            {displayTitle}
          </h3>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <PreviewRow
            icon={Calendar}
            label="Date"
            value={startTime ? formatDisplayDate(startTime) : "—"}
            primaryColor={primaryColor}
          />
          <PreviewRow
            icon={Clock}
            label="Time"
            value={formatTimeRange(startTime, endTime)}
            primaryColor={primaryColor}
          />
          <PreviewRow
            icon={MapPin}
            label={multiTicketEnabled && venues.length > 1 ? "Venues" : "Venue"}
            value={
              multiTicketEnabled
                ? venues.map((v) => v.name.trim() || "Unnamed venue").join(", ") || "—"
                : venue.trim() || "—"
            }
            primaryColor={primaryColor}
          />
          {totalSeats > 0 && (
            <PreviewRow
              icon={Users}
              label="Capacity"
              value={`${totalSeats} seats`}
              primaryColor={primaryColor}
            />
          )}
        </div>

        {ticketRows.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                Tickets
              </p>
              <ul className="space-y-1.5">
                {ticketRows.map((row, i) => (
                  <li
                    key={`${row.venue}-${row.tier}-${i}`}
                    className="flex items-start justify-between gap-2 text-sm rounded-md bg-muted/40 px-2.5 py-2"
                  >
                    <span className="min-w-0">
                      {multiTicketEnabled && venues.length > 1 && (
                        <span className="text-xs text-muted-foreground block">{row.venue}</span>
                      )}
                      <span className="font-medium">{row.tier}</span>
                    </span>
                    <span className="text-right shrink-0 text-muted-foreground">
                      {row.price > 0 ? `${sym}${row.price.toLocaleString()}` : "Free"}
                      {row.seats != null && row.seats > 0 && (
                        <span className="block text-xs">× {row.seats}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {description.trim() && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">About</p>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{description}</p>
            </div>
          </>
        )}

        {isPaid && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Refunds</span>
              {!isRefundAllowed ? (
                <NonRefundableBadge />
              ) : (
                <span className="text-xs text-muted-foreground">Refund option shown</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PreviewRow({
  icon: Icon,
  label,
  value,
  primaryColor,
}: {
  icon: typeof Calendar
  label: string
  value: string
  primaryColor: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-medium leading-snug break-words">{value}</p>
      </div>
    </div>
  )
}
