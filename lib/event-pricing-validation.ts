import type { VenueDraft } from "@/components/admin/venue-tier-matrix-builder"
import { getJointScreeningClubNames } from "@/lib/joint-screening-clubs"

export type PricingValidationResult = { ok: true } | { ok: false; message: string }

function fail(message: string): PricingValidationResult {
  return { ok: false, message }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

function isPositiveInt(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 1
}

function isNonNegativeInt(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0
}

function parseOptionalPositiveInt(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const n = Number(trimmed)
  if (!isPositiveInt(n)) return null
  return n
}

export function validateJointScreeningPartners(
  enabled: boolean,
  partnerClubNames: string[],
  homeClubName: string
): PricingValidationResult {
  if (!enabled) return { ok: true }

  const trimmed = partnerClubNames.map((n) => n.trim()).filter(Boolean)
  if (trimmed.length === 0) {
    return fail("Add at least one partner club for joint screening")
  }

  const homeKey = normalizeKey(homeClubName)
  const seen = new Set<string>()
  for (const name of trimmed) {
    const key = normalizeKey(name)
    if (homeKey && key === homeKey) {
      return fail(`Partner club "${name}" cannot be the same as your club (${homeClubName})`)
    }
    if (seen.has(key)) {
      return fail(`Duplicate partner club name: "${name}"`)
    }
    seen.add(key)
  }

  return { ok: true }
}

export function validateSingleTicketPricing(params: {
  venue: string
  ticketPrice: string
  maxAttendees: string
}): PricingValidationResult {
  if (!params.venue.trim()) {
    return fail("Venue is required")
  }

  const price = Number(params.ticketPrice)
  if (params.ticketPrice.trim() !== "" && (!Number.isFinite(price) || price < 0)) {
    return fail("Ticket price must be zero or a positive number")
  }

  if (params.maxAttendees.trim() !== "") {
    const max = parseOptionalPositiveInt(params.maxAttendees)
    if (max === null) {
      return fail("Max attendees must be a whole number of at least 1, or left blank for unlimited")
    }
  }

  return { ok: true }
}

function validateTier(
  venueLabel: string,
  tier: VenueDraft["tiers"][number],
  tierIndex: number,
  jointScreening?: { enabled: boolean; partnerClubNames: string[]; homeClubName?: string }
): PricingValidationResult {
  const tierLabel = tier.name.trim() || `Tier ${tierIndex + 1}`

  if (!tier.name.trim()) {
    return fail(`Enter a name for every ticket tier in "${venueLabel}"`)
  }

  if (!Number.isFinite(tier.price) || tier.price < 0) {
    return fail(`Price for "${venueLabel} – ${tierLabel}" must be zero or greater`)
  }

  if (!isPositiveInt(tier.allocation)) {
    return fail(`Seats for "${venueLabel} – ${tierLabel}" must be a whole number of at least 1`)
  }

  const clubNames = getJointScreeningClubNames(jointScreening)
  const hasClubSplit = Boolean(jointScreening?.enabled && clubNames.length > 0 && tier.clubAllocations?.length)

  if (hasClubSplit && tier.clubAllocations) {
    const clubSeen = new Set<string>()
    let clubTotal = 0

    for (const ca of tier.clubAllocations) {
      const clubName = ca.clubName.trim()
      if (!clubName) {
        return fail(`Every club seat split in "${venueLabel} – ${tierLabel}" needs a club name`)
      }
      const key = normalizeKey(clubName)
      if (clubSeen.has(key)) {
        return fail(`Duplicate club "${clubName}" in "${venueLabel} – ${tierLabel}" seat split`)
      }
      clubSeen.add(key)

      if (!isNonNegativeInt(ca.allocation)) {
        return fail(`Seat count for "${clubName}" in "${venueLabel} – ${tierLabel}" must be a whole number of 0 or more`)
      }
      clubTotal += ca.allocation
    }

    for (const expected of clubNames) {
      if (!clubSeen.has(normalizeKey(expected))) {
        return fail(`Seat split for "${venueLabel} – ${tierLabel}" must include "${expected}"`)
      }
    }

    if (clubTotal !== tier.allocation) {
      return fail(
        `Seat split for "${venueLabel} – ${tierLabel}" must total ${tier.allocation} (currently ${clubTotal})`
      )
    }

    if (clubTotal > 0 && tier.clubAllocations.some((ca) => ca.allocation < 1)) {
      return fail(`Each club in "${venueLabel} – ${tierLabel}" must have at least 1 seat when using per-club allocation`)
    }
  }

  return { ok: true }
}

function validateVenue(
  venue: VenueDraft,
  venueIndex: number,
  jointScreening?: { enabled: boolean; partnerClubNames: string[]; homeClubName?: string }
): PricingValidationResult {
  const venueLabel = venue.name.trim() || `Venue ${venueIndex + 1}`

  if (!venue.name.trim()) {
    return fail(`Enter a name for venue ${venueIndex + 1}`)
  }

  if (venue.tiers.length === 0) {
    return fail(`"${venueLabel}" must have at least one ticket tier`)
  }

  const tierKeys = new Set<string>()
  for (let ti = 0; ti < venue.tiers.length; ti++) {
    const tier = venue.tiers[ti]
    const tierKey = normalizeKey(tier.name)
    if (tierKeys.has(tierKey)) {
      return fail(`Duplicate tier name "${tier.name.trim()}" in "${venueLabel}"`)
    }
    tierKeys.add(tierKey)

    const tierResult = validateTier(venueLabel, tier, ti, jointScreening)
    if (!tierResult.ok) return tierResult
  }

  return { ok: true }
}

export function validateMultiTicketPricing(params: {
  venues: VenueDraft[]
  venueNameFallback?: string
  jointScreening?: { enabled: boolean; partnerClubNames: string[]; homeClubName?: string }
}): PricingValidationResult {
  if (params.venues.length === 0) {
    return fail("Add at least one venue and ticket tier for multi-ticket events")
  }

  const venueKeys = new Set<string>()
  for (let vi = 0; vi < params.venues.length; vi++) {
    let venue = params.venues[vi]
    if (vi === 0 && !venue.name.trim() && params.venueNameFallback?.trim()) {
      venue = { ...venue, name: params.venueNameFallback.trim() }
    }
    const venueKey = normalizeKey(venue.name)
    if (!venue.name.trim()) {
      return fail(`Enter a name for venue ${vi + 1}`)
    }
    if (venueKeys.has(venueKey)) {
      return fail(`Duplicate venue name: "${venue.name.trim()}"`)
    }
    venueKeys.add(venueKey)

    const venueResult = validateVenue(venue, vi, params.jointScreening)
    if (!venueResult.ok) return venueResult
  }

  return { ok: true }
}

export function validatePricingLogisticsStep(params: {
  multiTicketEnabled: boolean
  venue: string
  ticketPrice: string
  maxAttendees: string
  venues: VenueDraft[]
  jointScreeningEnabled: boolean
  partnerClubNames: string[]
  homeClubName: string
  primaryVenueName: string
  primaryTicketPrice: string
  primaryMaxAttendees: string
}): PricingValidationResult {
  const jointConfig = params.jointScreeningEnabled
    ? { enabled: true as const, partnerClubNames: params.partnerClubNames, homeClubName: params.homeClubName }
    : undefined

  const partnerResult = validateJointScreeningPartners(
    params.jointScreeningEnabled,
    params.partnerClubNames,
    params.homeClubName
  )
  if (!partnerResult.ok) return partnerResult

  if (params.multiTicketEnabled) {
    return validateMultiTicketPricing({
      venues: params.venues,
      venueNameFallback: params.primaryVenueName,
      jointScreening: jointConfig,
    })
  }

  return validateSingleTicketPricing({
    venue: params.venue,
    ticketPrice: params.ticketPrice,
    maxAttendees: params.maxAttendees,
  })
}
