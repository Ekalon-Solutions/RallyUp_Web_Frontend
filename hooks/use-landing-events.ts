"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient, type Event } from "@/lib/api"
import { formatEventPriceDisplay, getEventVenueDisplay, hasVenueTierMatrix } from "@/lib/event-display-price"
import { listingTypeLabel, listingTypeOf } from "@/lib/listings"

// Landing tab -> event category. null = no category filter.
const TAB_CATEGORY: Record<string, string | null> = {
  "All Events": null,
  All: null,
  Screenings: "screenings",
  "Watch-Parties": "watch-parties",
}

/** Fired by the navbar search box while on "/" (detail = query string). */
export const LANDING_SEARCH_EVENT = "landing-search"

/** Search text for the landing page: seeded from `?q=`, then kept in sync with the navbar search box. */
export function useLandingSearch() {
  const [search, setSearch] = useState("")
  useEffect(() => {
    // Read once on mount instead of useSearchParams, so the page needs no Suspense boundary.
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) setSearch(q)
    const onSearch = (e: globalThis.Event) => setSearch(String((e as CustomEvent<string>).detail ?? ""))
    window.addEventListener(LANDING_SEARCH_EVENT, onSearch)
    return () => window.removeEventListener(LANDING_SEARCH_EVENT, onSearch)
  }, [])
  return [search, setSearch] as const
}

export interface LandingEventFilters {
  tab: string
  search: string
  /** "YYYY-MM-DD" (local day) or "" for any date. */
  date: string
  /** A venue name from `locations`, or "" for any location. */
  location: string
}

/** Venue names of an event (one per venue for multi-venue events). */
const venueNames = (e: Event): string[] => {
  const names = e.venues?.length ? e.venues.map((v) => v.name?.trim()) : [e.venue?.trim()]
  return names.filter((n): n is string => !!n)
}

/** True if the event runs at any point during the local day `ymd`. */
const happensOn = (e: Event, ymd: string) => {
  const start = startMs(e)
  if (Number.isNaN(start)) return false
  const [y, m, d] = ymd.split("-").map(Number)
  const dayStart = new Date(y, m - 1, d).getTime()
  const dayEnd = new Date(y, m - 1, d + 1).getTime()
  const end = e.endTime ? new Date(e.endTime).getTime() : start
  return start < dayEnd && end >= dayStart
}

/** Public, active events for the landing page, filtered by tab, search text, date and location. */
export function useLandingEvents({ tab, search, date, location }: LandingEventFilters) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient
      .getPublicEvents()
      .then((res) => {
        if (cancelled || !res.success || !res.data) return
        setEvents(
          res.data
            // Donation drives aren't events; they don't belong in the landing feed.
            .filter((e) => e.isActive && listingTypeOf(e) !== "donation")
            // Dated events first (soonest first), undated listings after.
            .sort((a, b) => (startMs(a) || Infinity) - (startMs(b) || Infinity))
        )
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const category = TAB_CATEGORY[tab] ?? null
    const q = search.trim().toLowerCase()
    return events.filter((e) => {
      if (category && e.category !== category) return false
      if (date && !happensOn(e, date)) return false
      if (location && !venueNames(e).includes(location)) return false
      if (!q) return true
      return [e.title, e.description, getEventVenueDisplay(e), e.category]
        .some((field) => field?.toLowerCase().includes(q))
    })
  }, [events, tab, search, date, location])

  // Location choices come from every loaded event, so picking one never empties the list.
  const locations = useMemo(
    () => [...new Set(events.flatMap(venueNames))].sort((a, b) => a.localeCompare(b)),
    [events]
  )

  return { events: filtered, loading, locations }
}

// Activities can have no start date.
const startMs = (e: Event) => (e.startTime ? new Date(e.startTime).getTime() : NaN)

export const eventTag = (e: Event) =>
  listingTypeOf(e) === "event" ? e.category.replace(/-/g, " ").toUpperCase() : listingTypeLabel(e).toUpperCase()

/** "OCT 24", or "" when the listing has no date. */
export const eventShortDate = (e: Event) =>
  Number.isNaN(startMs(e)) ? "" : new Date(startMs(e)).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase()

export const eventWhen = (e: Event) =>
  Number.isNaN(startMs(e))
    ? "Open now"
    : new Date(startMs(e)).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export const eventPrice = (e: Event) => formatEventPriceDisplay(e, { fromPrefix: hasVenueTierMatrix(e) }) ?? "Free"

export const eventVenue = (e: Event) => getEventVenueDisplay(e)

/** Ongoing = started (or undated, e.g. an open activity) and not yet ended. */
export const isOngoing = (e: Event, now = Date.now()) =>
  (Number.isNaN(startMs(e)) || startMs(e) <= now) && (!e.endTime || new Date(e.endTime).getTime() >= now)

/* ------------------------------- Membership ------------------------------- */

export interface LandingPlan {
  _id: string
  name: string
  description?: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
  isActive?: boolean
  club: { _id: string; name: string }
}

type ClubWithPlans = { _id: string; name: string; membershipPlans?: Omit<LandingPlan, "club">[] }

/** Active membership plans of every public club, cheapest first. */
export function useLandingPlans() {
  const [plans, setPlans] = useState<LandingPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient
      .getPublicClubs()
      .then((res) => {
        if (cancelled || !res.success) return
        const clubs = ((res.data as { clubs?: unknown } | undefined)?.clubs ?? []) as ClubWithPlans[]
        setPlans(
          clubs
            .flatMap((club) =>
              (club.membershipPlans ?? [])
                .filter((p) => p?.isActive)
                .map((p) => ({ ...p, club: { _id: club._id, name: club.name } }))
            )
            .sort((a, b) => (a.price || 0) - (b.price || 0))
        )
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return { plans, loading }
}

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).replace(" ", ", ")

/** "Sep, 2026 - Sep, 2027" from the plan window, else its length ("12 months", "Lifetime"). */
export const planValidity = (p: LandingPlan) => {
  if (p.planStartDate && p.planEndDate) return `${monthYear(p.planStartDate)} - ${monthYear(p.planEndDate)}`
  const months = p.duration ?? 0
  if (months === 0) return "Lifetime"
  return months === 1 ? "1 month" : `${months} months`
}
