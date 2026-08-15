import type { Event } from "@/lib/api"
import { getEventVenueDisplay } from "@/lib/event-display-price"

export const MEMBER_NAME_TOKEN = "{{member_name}}"

export const MEMBER_TOKENS = {
  member_name: "{{member_name}}",
  member_first_name: "{{member_first_name}}",
  member_last_name: "{{member_last_name}}",
  member_email: "{{member_email}}",
  member_phone: "{{member_phone}}",
  member_plan: "{{member_plan}}",
  member_id: "{{member_id}}",
} as const

export const SAMPLE_MEMBER = {
  member_name: "Alex Kumar",
  member_first_name: "Alex",
  member_last_name: "Kumar",
  member_email: "alex@example.com",
  member_phone: "+91 98765 43210",
  member_plan: "Gold",
  member_id: "AMSC-001",
}

export type MemberDetailRole = keyof typeof MEMBER_TOKENS

export type TemplateSlotRole =
  | MemberDetailRole
  | "club_name"
  | "event_name"
  | "event_type"
  | "event_date"
  | "event_time"
  | "venue"
  | "custom"

export function isMemberRole(role: TemplateSlotRole): role is MemberDetailRole {
  return role in MEMBER_TOKENS
}

export interface TemplateSlot {
  index: number
  role: TemplateSlotRole
  label: string
}

export const ROLE_LABELS: Record<TemplateSlotRole, string> = {
  custom: "Custom text",
  member_name: "Member · Full name",
  member_first_name: "Member · First name",
  member_last_name: "Member · Last name",
  member_email: "Member · Email",
  member_phone: "Member · Phone",
  member_plan: "Member · Plan",
  member_id: "Member · Member ID",
  club_name: "Club name",
  event_name: "Event name",
  event_type: "Event type",
  event_date: "Event date",
  event_time: "Event time",
  venue: "Location",
}

export const SLOT_ROLES: TemplateSlotRole[] = [
  "custom",
  "member_name",
  "member_first_name",
  "member_last_name",
  "member_email",
  "member_phone",
  "member_plan",
  "member_id",
  "club_name",
  "event_name",
  "event_type",
  "event_date",
  "event_time",
  "venue",
]

const CATEGORY_LABELS: Record<string, string> = {
  screenings: "Screening",
  "footy-meets": "Footy Meet",
  tournaments: "Tournament",
  auctions: "Auction",
  "club-events": "Club Event",
  "social-events": "Social Event",
  "csr-events": "CSR Event",
  "watch-parties": "Watch Party",
  "travel-days": "Travel Day",
  workshops: "Workshop",
  "general-meeting": "General Meeting",
  matchday: "Matchday",
  others: "Event",
}

export function emptySlots(indexes: number[]): TemplateSlot[] {
  return indexes.map((index) => ({
    index,
    role: "custom",
    label: ROLE_LABELS.custom,
  }))
}

export function valueForRole(
  role: TemplateSlotRole,
  ctx: { clubName?: string; event?: Event | null }
): string {
  const event = ctx.event
  switch (role) {
    case "member_name":
    case "member_first_name":
    case "member_last_name":
    case "member_email":
    case "member_phone":
    case "member_plan":
    case "member_id":
      return MEMBER_TOKENS[role]
    case "club_name":
      return ctx.clubName?.trim() || ""
    case "event_name":
      return event?.title?.trim() || ""
    case "event_type":
      return eventTypeLabel(event?.category)
    case "event_date":
      return formatTemplateDate(event?.startTime || event?.eventDate)
    case "event_time":
      return formatTemplateTime(event?.startTime || event?.eventTime)
    case "venue":
      return event ? getEventVenueDisplay(event) : ""
    default:
      return ""
  }
}

export function formatTemplateDate(value?: string | Date | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${date.getFullYear()}`
}

export function formatTemplateTime(value?: string | Date | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}

export function eventTypeLabel(category?: string): string {
  if (!category) return "Event"
  return CATEGORY_LABELS[category] || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function valuesFromContext(
  slots: TemplateSlot[],
  ctx: { clubName?: string; event?: Event | null }
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const slot of slots) {
    values[String(slot.index)] = valueForRole(slot.role, ctx)
  }
  return values
}

const DYNAMIC_URL = /^(.*)\{\{\s*\d+\s*\}\}(.*)$/

export function isDynamicUrlButton(url?: string): boolean {
  return Boolean(url && DYNAMIC_URL.test(url))
}

export function urlButtonParameter(templateUrl: string | undefined, userValue: string): string {
  const value = String(userValue || "").trim()
  if (!value) return ""
  if (!templateUrl) return value
  const match = templateUrl.match(DYNAMIC_URL)
  if (!match) return ""
  const prefix = match[1]
  const suffix = match[2]
  if (prefix && value.startsWith(prefix) && (!suffix || value.endsWith(suffix))) {
    return value.slice(prefix.length, suffix ? value.length - suffix.length : undefined)
  }
  if (prefix && value.startsWith(prefix)) {
    return value.slice(prefix.length)
  }
  return value
}

export function resolveUrlButtonHref(templateUrl: string | undefined, userValue?: string): string {
  if (!templateUrl) return String(userValue || "").trim()
  const match = templateUrl.match(DYNAMIC_URL)
  if (!match) return userValue?.trim() || templateUrl
  const param = urlButtonParameter(templateUrl, userValue || "")
  return `${match[1]}${param || "{{1}}"}${match[2]}`
}

export function renderTemplatePreview(
  body: string,
  variables: Record<string, string>,
  sampleMemberName = SAMPLE_MEMBER.member_name
): string {
  return body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_match, index) => {
    const value = variables[String(index)]?.trim()
    if (!value) return `{{${index}}}`
    for (const [role, token] of Object.entries(MEMBER_TOKENS)) {
      if (value === token) {
        if (role === "member_name") return sampleMemberName
        return SAMPLE_MEMBER[role as MemberDetailRole]
      }
    }
    return value
  })
}
