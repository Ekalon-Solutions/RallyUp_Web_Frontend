import type { GTSLeagueFixture } from "@/lib/api"

const IST = "Asia/Kolkata"
const LOCK_MS = 90 * 60 * 1000

/** Parse a fixture's start time into a JS Date (UTC). */
export function parseFixtureDate(fixture: GTSLeagueFixture): Date | null {
  if (fixture.strTimestamp) {
    const d = new Date(fixture.strTimestamp)
    if (!isNaN(d.getTime())) return d
  }
  if (fixture.dateEvent) {
    const d = new Date(`${fixture.dateEvent}T${fixture.strTime || "00:00:00"}Z`)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

const DATE_TIME_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const DAY_FMT = new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short" })

/** Locked by the server, or its T−90 deadline has passed since the page loaded. */
export function isFixtureLocked(fixture: GTSLeagueFixture): boolean {
  if (fixture.locked) return true
  const kickoff = parseFixtureDate(fixture)
  return !!kickoff && Date.now() >= kickoff.getTime() - LOCK_MS
}

/** Human-readable match date/time in IST, e.g. "Sat, 4 Apr, 17:15 IST" */
export function formatMatchDateTime(fixture: GTSLeagueFixture): string {
  const d = parseFixtureDate(fixture)
  return d ? DATE_TIME_FMT.format(d) + " IST" : fixture.dateEvent ?? ""
}

/** "Predict by Sat, 4 Apr, 16:00 IST" */
export function getMatchDeadline(fixture: GTSLeagueFixture): string {
  const kickoff = parseFixtureDate(fixture)
  return kickoff ? "Predict by " + DATE_TIME_FMT.format(new Date(kickoff.getTime() - LOCK_MS)) + " IST" : ""
}

export interface MatchWeek {
  key: string
  label: string
  /** e.g. "20 – 24 Sep" */
  range: string
  fixtures: GTSLeagueFixture[]
}

/**
 * Week pills from the server's matchdayKey. Weeks are ordered by their median
 * kick-off (a single rescheduled match doesn't drag its round out of order)
 * and labelled by position, so league rounds, cup stages and calendar-week
 * buckets all read as "Week N".
 */
export function groupIntoWeeks(fixtures: GTSLeagueFixture[]): MatchWeek[] {
  const byKey = new Map<string, GTSLeagueFixture[]>()
  for (const f of fixtures) {
    const key = f.matchdayKey || f.dateEvent
    byKey.set(key, [...(byKey.get(key) ?? []), f])
  }
  const time = (f: GTSLeagueFixture) => parseFixtureDate(f)?.getTime() ?? 0
  return [...byKey.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => time(a) - time(b))
      return { key, sorted, median: time(sorted[Math.floor(sorted.length / 2)]) }
    })
    .sort((a, b) => a.median - b.median)
    .map(({ key, sorted }, i) => {
      const first = parseFixtureDate(sorted[0])
      const last = parseFixtureDate(sorted[sorted.length - 1])
      const a = first ? DAY_FMT.format(first) : ""
      const b = last ? DAY_FMT.format(last) : ""
      return { key, label: `Week ${i + 1}`, range: a === b ? a : `${a} – ${b}`, fixtures: sorted }
    })
}
