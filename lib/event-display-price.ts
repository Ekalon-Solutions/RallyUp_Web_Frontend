import type { Event } from "@/lib/api"

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

type EventLike = Pick<Event, "venues" | "ticketPrice" | "venue" | "currency" | "currentAttendees" | "maxAttendees">

function getVenueTiers(venue: { tiers?: Array<{ price?: number; allocation?: number; sold?: number; name?: string }> } | null | undefined) {
  return Array.isArray(venue?.tiers) ? venue.tiers : []
}

export function normalizeEventVenues<T extends Pick<Event, "venues">>(event: T): T {
  if (!event?.venues || !Array.isArray(event.venues)) return event
  return {
    ...event,
    venues: event.venues.map((venue) => ({
      ...venue,
      tiers: getVenueTiers(venue),
    })),
  } as T
}

export function hasVenueTierMatrix(event: Pick<Event, "venues"> | null | undefined): boolean {
  if (!event?.venues?.length) return false
  return event.venues.some((v) => getVenueTiers(v).length > 0)
}

export function getEventTierPrices(event: EventLike): number[] {
  if (hasVenueTierMatrix(event)) {
    return event.venues!.flatMap((v) =>
      getVenueTiers(v).map((t) => Number(t.price)).filter((p) => Number.isFinite(p))
    )
  }
  const base = Number(event.ticketPrice)
  return Number.isFinite(base) ? [base] : []
}

export function getEventPaidTierPrices(event: EventLike): number[] {
  return getEventTierPrices(event).filter((p) => p > 0)
}

export function getEventLowestTicketPrice(event: EventLike): number {
  const paid = getEventPaidTierPrices(event)
  if (paid.length > 0) return Math.min(...paid)
  const all = getEventTierPrices(event)
  return all.length > 0 ? Math.min(...all) : Number(event.ticketPrice) || 0
}

export function getEventHighestTicketPrice(event: EventLike): number {
  const prices = getEventPaidTierPrices(event)
  if (prices.length > 0) return Math.max(...prices)
  const all = getEventTierPrices(event)
  return all.length > 0 ? Math.max(...all) : Number(event.ticketPrice) || 0
}

export function isEventPaid(event: EventLike): boolean {
  return getEventPaidTierPrices(event).length > 0
}

export function getEventCurrencySymbol(currency?: string): string {
  const code = currency ?? "INR"
  return CURRENCY_SYMBOLS[code] ?? `${code} `
}

export function formatEventPriceDisplay(
  event: Pick<Event, "venues" | "ticketPrice" | "currency" | "venue" | "currentAttendees" | "maxAttendees">,
  options?: { fromPrefix?: boolean; includeFees?: boolean }
): string | null {
  const paid = getEventPaidTierPrices(event)
  if (paid.length === 0) return null

  const min = Math.min(...paid)
  const max = Math.max(...paid)
  const sym = getEventCurrencySymbol(event.currency)
  const fees = options?.includeFees ? " (+ Fees)" : ""
  const from = options?.fromPrefix && (hasVenueTierMatrix(event) || min !== max) ? "From " : ""

  if (min === max) {
    return `${from}${sym}${min.toLocaleString()}${fees}`
  }
  return `${from}${sym}${min.toLocaleString()} – ${sym}${max.toLocaleString()}${fees}`
}

export function getEventVenueDisplay(event: Pick<Event, "venues" | "venue">): string {
  if (event.venues?.length) {
    const names = event.venues.map((v) => v.name?.trim()).filter(Boolean)
    if (names.length > 0) return names.join(", ")
  }
  return event.venue?.trim() || "—"
}

export function getEventCapacity(event: EventLike): { count: number; max: number | null } {
  if (hasVenueTierMatrix(event)) {
    let total = 0
    let sold = 0
    for (const venue of event.venues ?? []) {
      for (const tier of getVenueTiers(venue)) {
        total += tier.allocation ?? 0
        sold += tier.sold ?? 0
      }
    }
    return { count: sold, max: total > 0 ? total : null }
  }
  return {
    count: event.currentAttendees ?? 0,
    max: event.maxAttendees ?? null,
  }
}

export function getEventTicketRows(event: EventLike) {
  if (hasVenueTierMatrix(event)) {
    return event.venues!.flatMap((venue) =>
      getVenueTiers(venue).map((tier) => ({
        venue: venue.name?.trim() || "Venue",
        tier: tier.name?.trim() || "Tier",
        price: Number(tier.price) || 0,
        seats: tier.allocation ?? null,
      }))
    )
  }
  return [
    {
      venue: event.venue?.trim() || "Venue",
      tier: "General",
      price: Number(event.ticketPrice) || 0,
      seats: event.maxAttendees ?? null,
    },
  ]
}

export function formatTierPrice(amount: number, currency?: string): string {
  if (amount <= 0) return "Free"
  return `${getEventCurrencySymbol(currency)}${amount.toLocaleString()}`
}
