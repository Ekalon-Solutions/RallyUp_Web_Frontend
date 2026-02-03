export type WebsiteSectionKey =
  | "news"
  | "events"
  | "polls"
  | "chants"
  | "members"
  | "store"
  | "merchandise"

export type WebsiteSectionsRecord = Partial<Record<WebsiteSectionKey, boolean>>

export type WebsiteSectionOption = Readonly<{
  id: string
  label: string
  description: string
  keys: readonly WebsiteSectionKey[]
}>

export const WEBSITE_SECTION_OPTIONS: readonly WebsiteSectionOption[] = [
  {
    id: "news",
    label: "News & Updates",
    description: "Show club news posts on the public site.",
    keys: ["news"],
  },
  {
    id: "events",
    label: "Events & Tickets",
    description: "Show upcoming events on the public site.",
    keys: ["events"],
  },
  {
    id: "polls",
    label: "Polls",
    description: "Let visitors see community polls.",
    keys: ["polls"],
  },
  {
    id: "chants",
    label: "Club Chants",
    description: "Show supporter chants & songs.",
    keys: ["chants"],
  },
  {
    id: "members",
    label: "Members",
    description: "Show members/community section on the public site.",
    keys: ["members"],
  },
  {
    id: "store",
    label: "Merchandise",
    description: "Show merchandise section on the public site.",
    keys: ["store", "merchandise"],
  },
] as const

export const DEFAULT_WEBSITE_SECTIONS: Record<WebsiteSectionKey, boolean> = {
  news: true,
  events: true,
  polls: true,
  chants: true,
  members: true,
  store: true,
  merchandise: true,
}

export function isWebsiteOptionEnabled(sections: WebsiteSectionsRecord, option: WebsiteSectionOption): boolean {
  return option.keys.some((k) => Boolean(sections[k]))
}

export function setWebsiteOptionEnabled(
  sections: WebsiteSectionsRecord,
  option: WebsiteSectionOption,
  enabled: boolean,
): WebsiteSectionsRecord {
  const next: WebsiteSectionsRecord = { ...sections }
  option.keys.forEach((k) => {
    next[k] = enabled
  })
  return next
}

export function sanitizeWebsiteSections(sections: Record<string, any> | undefined | null): WebsiteSectionsRecord {
  const allowedKeys = new Set<WebsiteSectionKey>(WEBSITE_SECTION_OPTIONS.flatMap((o) => o.keys as WebsiteSectionKey[]))
  const input = sections || {}
  const next: WebsiteSectionsRecord = {}
  for (const [k, v] of Object.entries(input)) {
    if (allowedKeys.has(k as WebsiteSectionKey)) {
      next[k as WebsiteSectionKey] = Boolean(v)
    }
  }
  return next
}
