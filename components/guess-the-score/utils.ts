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
