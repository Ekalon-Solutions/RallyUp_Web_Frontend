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

export function hasVenueTierMatrix(event: Pick<Event, "venues"> | null | undefined): boolean {
  return Boolean(
    event?.venues?.length &&
    event.venues.some((v) => Array.isArray(v.tiers) && v.tiers.length > 0)
  )
}

export function getEventTierPrices(event: Pick<Event, "venues" | "ticketPrice">): number[] {
  if (hasVenueTierMatrix(event)) {
    return event.venues!.flatMap((v) => v.tiers.map((t) => t.price)).filter((p) => Number.isFinite(p))
  }
  const base = Number(event.ticketPrice)
  return Number.isFinite(base) ? [base] : []
}

export function getEventPaidTierPrices(event: Pick<Event, "venues" | "ticketPrice">): number[] {
  return getEventTierPrices(event).filter((p) => p > 0)
}

export function getEventLowestTicketPrice(event: Pick<Event, "venues" | "ticketPrice">): number {
  const paid = getEventPaidTierPrices(event)
  if (paid.length > 0) return Math.min(...paid)
  const all = getEventTierPrices(event)
  return all.length > 0 ? Math.min(...all) : Number(event.ticketPrice) || 0
}

export function getEventHighestTicketPrice(event: Pick<Event, "venues" | "ticketPrice">): number {
  const prices = getEventPaidTierPrices(event)
  if (prices.length > 0) return Math.max(...prices)
  const all = getEventTierPrices(event)
  return all.length > 0 ? Math.max(...all) : Number(event.ticketPrice) || 0
}

export function isEventPaid(event: Pick<Event, "venues" | "ticketPrice">): boolean {
  return getEventPaidTierPrices(event).length > 0
}

export function getEventCurrencySymbol(currency?: string): string {
  const code = currency ?? "INR"
  return CURRENCY_SYMBOLS[code] ?? `${code} `
}

export function formatEventPriceDisplay(
  event: Pick<Event, "venues" | "ticketPrice" | "currency">,
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
