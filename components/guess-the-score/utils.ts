import type { GTSFixture } from "./all-fixtures-sheet"

const IST = "Asia/Kolkata"

/** Parse a fixture's start time into a JS Date (UTC). */
export function parseFixtureDate(fixture: GTSFixture): Date | null {
  // strTimestamp may come as:
  //   "2024-08-17T14:00:00+00:00"  (SportsDB with offset)
  //   "2024-08-17T14:00:00Z"       (ISO UTC)
  //   "2024-08-17T14:00:00.000Z"   (DB toISOString)
  //   "2024-08-17T14:00:00"        (no suffix – treat as UTC)
  if (fixture.strTimestamp) {
    const ts = fixture.strTimestamp
      .replace(/\+00:00$/, "Z")  // +00:00 → Z
      .replace(/([^Z])$/, "$1Z") // no suffix → append Z
    const d = new Date(ts)
    if (!isNaN(d.getTime())) return d
  }
  // Fallback: dateEvent ("YYYY-MM-DD") + strTime ("HH:MM:SS") → UTC
  if (fixture.dateEvent && fixture.strTime) {
    const d = new Date(`${fixture.dateEvent}T${fixture.strTime}Z`)
    if (!isNaN(d.getTime())) return d
  }
  if (fixture.dateEvent) {
    const d = new Date(`${fixture.dateEvent}T00:00:00Z`)
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

const DEADLINE_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** Statuses meaning the match has been played. */
const FINISHED_STATUSES = new Set([
  "Match Finished",
  "FT",
  "AET",
  "PEN",
  "Awarded",
])

/** Statuses meaning the match will not be played as scheduled. */
const OFF_STATUSES = new Set([
  "Post",
  "Postponed",
  "Match Postponed",
  "Cancelled",
  "Canceled",
  "Match Cancelled",
  "Abandoned",
  "Match Abandoned",
  "Suspended",
])

/** Statuses meaning kick-off has not happened yet. */
const NOT_STARTED_STATUSES = new Set(["", "Not Started", "NS", "Scheduled", "TBD"])

/**
 * A fixture only counts as in-progress for this long after kick-off. The feed
 * sometimes leaves a status behind on a match that finished days ago, and
 * without this bound that stale fixture is picked as "the next match" forever.
 */
const MAX_LIVE_MS = 4 * 60 * 60 * 1000

function statusOf(fixture: GTSFixture): string {
  return (fixture.strStatus ?? "").trim()
}

export function isFinishedFixture(fixture: GTSFixture): boolean {
  return FINISHED_STATUSES.has(statusOf(fixture))
}

/** Postponed, cancelled or abandoned — not predictable, not a result either. */
export function isOffFixture(fixture: GTSFixture): boolean {
  return OFF_STATUSES.has(statusOf(fixture))
}

/** In progress: an unrecognised status *and* kick-off within the live window. */
export function isLiveFixture(fixture: GTSFixture): boolean {
  const status = statusOf(fixture)
  if (
    FINISHED_STATUSES.has(status) ||
    OFF_STATUSES.has(status) ||
    NOT_STARTED_STATUSES.has(status)
  ) {
    return false
  }
  const kickoff = parseFixtureDate(fixture)
  if (!kickoff) return false
  const elapsed = Date.now() - kickoff.getTime()
  return elapsed >= 0 && elapsed <= MAX_LIVE_MS
}

/** Yet to kick off. Driven by kick-off time, so a stale status can't qualify. */
export function isUpcomingFixture(fixture: GTSFixture): boolean {
  const status = statusOf(fixture)
  if (FINISHED_STATUSES.has(status) || OFF_STATUSES.has(status)) return false
  const kickoff = parseFixtureDate(fixture)
  if (!kickoff) return NOT_STARTED_STATUSES.has(status)
  return kickoff.getTime() > Date.now()
}

/** Kick-off order, earliest first. Fixtures with no usable date sort last. */
export function sortByKickoff(fixtures: GTSFixture[]): GTSFixture[] {
  return [...fixtures].sort(
    (a, b) =>
      (parseFixtureDate(a)?.getTime() ?? Infinity) -
      (parseFixtureDate(b)?.getTime() ?? Infinity)
  )
}

/**
 * The fixture to feature: the match in progress, otherwise the soonest one that
 * has not kicked off. Chosen by kick-off time rather than the feed's ordering.
 */
export function getNextFixture(fixtures: GTSFixture[]): GTSFixture | undefined {
  const live = sortByKickoff(fixtures.filter(isLiveFixture))
  if (live.length > 0) return live[0]
  return sortByKickoff(fixtures.filter(isUpcomingFixture))[0]
}

/** Prediction deadline = kick-off minus 90 minutes. */
export function isPredictionDeadlinePassed(fixture: GTSFixture): boolean {
  const kickoff = parseFixtureDate(fixture)
  if (!kickoff) return false
  const deadline = new Date(kickoff.getTime() - 90 * 60 * 1000)
  return Date.now() >= deadline.getTime()
}

/** Human-readable match date/time in IST, e.g. "Sat, 4 Apr, 17:15 IST" */
export function formatMatchDateTime(fixture: GTSFixture): string {
  const d = parseFixtureDate(fixture)
  if (!d) return fixture.dateEvent ?? ""
  return DATE_TIME_FMT.format(d) + " IST"
}

/** Short deadline label in IST, e.g. "Predict by Sat, 4 Apr, 16:00 IST" */
export function getMatchDeadline(fixture: GTSFixture): string {
  const kickoff = parseFixtureDate(fixture)
  if (!kickoff) return ""
  const deadline = new Date(kickoff.getTime() - 90 * 60 * 1000)
  return "Predict by " + DEADLINE_FMT.format(deadline) + " IST"
}

export type PointsResult = "exact" | "close" | "correct_outcome" | "incorrect"

/**
 * Calculate GTS points given predicted and actual scores.
 * - 3 pts  → exact score
 * - 1.5 pts → correct outcome + total goal diff of 1 (close)
 * - 1 pt   → correct outcome (win/draw/loss direction)
 * - 0 pts  → wrong outcome
 */
export function calcPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): { points: number; result: PointsResult } {
  if (predHome === actualHome && predAway === actualAway) {
    return { points: 3, result: "exact" }
  }

  const predOutcome = predHome > predAway ? "H" : predHome < predAway ? "A" : "D"
  const actualOutcome = actualHome > actualAway ? "H" : actualHome < actualAway ? "A" : "D"

  if (predOutcome === actualOutcome) {
    const totalDiff = Math.abs(predHome - actualHome) + Math.abs(predAway - actualAway)
    if (totalDiff === 1) {
      return { points: 1.5, result: "close" }
    }
    return { points: 1, result: "correct_outcome" }
  }

  return { points: 0, result: "incorrect" }
}
