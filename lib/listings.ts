import type { Event, ListingType } from "@/lib/api"
import { slugify } from "@/lib/utils"

export const ACTIVITY_CATEGORIES = [
  { value: "contests", label: "Contests" },
  { value: "general-meeting", label: "General meeting" },
  { value: "workshops", label: "Workshops" },
  { value: "offsite-trips", label: "Offsite/Trips" },
  { value: "others", label: "Others" },
]

/** `donations` = money drive; `csr-events` = item (CSR) drive. */
export const DONATION_CATEGORIES = [
  { value: "donations", label: "Monetary" },
  { value: "csr-events", label: "Items (CSR)" },
]

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function listingTypeOf(event: Pick<Event, "listingType">): ListingType {
  return event.listingType ?? "event"
}

/** Human label for the listing type column / badges: Contest, Activity, Donation Drive, CSR Drive, Event. */
export function listingTypeLabel(event: Pick<Event, "listingType" | "category">): string {
  const type = listingTypeOf(event)
  if (type === "donation") return event.category === "csr-events" ? "CSR Drive" : "Donation Drive"
  if (type === "activity") return event.category === "contests" ? "Contest" : "Activity"
  return "Event"
}

/** Where the admin edits this listing. */
export function listingEditHref(event: Pick<Event, "_id" | "listingType">): string {
  const type = listingTypeOf(event)
  if (type === "activity") return `/dashboard/events/activity?edit=${event._id}`
  if (type === "donation") return `/dashboard/events/donation?edit=${event._id}`
  return `/dashboard/events/create?edit=${event._id}`
}

/** Public detail page — same slug rule the backend enforces as unique per club. */
export function listingPublicHref(clubSlug: string, event: Pick<Event, "title">): string {
  return `/clubs/${clubSlug}/events/${slugify(event.title)}`
}
