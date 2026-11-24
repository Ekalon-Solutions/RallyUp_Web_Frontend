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

/** Public, active events for the landing page, filtered by tab + search text. */
export function useLandingEvents(tab: string, search: string) {
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
      if (!q) return true
      return [e.title, e.description, getEventVenueDisplay(e), e.category]
        .some((field) => field?.toLowerCase().includes(q))
    })
  }, [events, tab, search])

  return { events: filtered, loading }
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
