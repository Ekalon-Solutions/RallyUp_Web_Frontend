export function listUserEventRegistrations(event: any, userId: string | undefined | null) {
  if (!event || !userId) return []
  return (event.registrations || []).filter(
    (r: any) => r && String(r.userId) === String(userId)
  )
}

/** Prefer confirmed, then pending, then cancelled; most recent first within each tier. */
export function findUserEventRegistration(event: any, userId: string | undefined | null) {
  const regs = listUserEventRegistrations(event, userId)
  if (regs.length === 0) return null

  const rank = (status: string) => {
    if (status === 'confirmed') return 3
    if (status === 'pending') return 2
    if (status === 'cancelled') return 1
    return 0
  }

  regs.sort((a: any, b: any) => {
    const statusDiff = rank(b.status) - rank(a.status)
    if (statusDiff !== 0) return statusDiff
    return (
      new Date(b.registrationDate || b.createdAt || 0).getTime() -
      new Date(a.registrationDate || a.createdAt || 0).getTime()
    )
  })

  return regs[0]
}

export function resolveUserEventRegistration(
  event: any,
  userId: string | undefined | null,
  registrationByEventId?: Map<string, any> | null
) {
  if (!event || !userId) return null

  const fromEvent = findUserEventRegistration(event, userId)
  const fromMap = registrationByEventId?.get(String(event._id))

  if (!fromEvent && !fromMap) return null
  if (!fromEvent) return fromMap
  if (!fromMap) return fromEvent

  const rank = (status: string) => {
    if (status === 'confirmed') return 3
    if (status === 'pending') return 2
    if (status === 'cancelled') return 1
    return 0
  }

  const mapRank = rank(fromMap.status)
  const eventRank = rank(fromEvent.status)
  if (mapRank !== eventRank) {
    return mapRank > eventRank ? fromMap : fromEvent
  }

  if (typeof fromMap.activeTicketCount === 'number' && fromMap.activeTicketCount > 0) {
    return fromMap
  }
  if (typeof fromEvent.activeTicketCount === 'number' && fromEvent.activeTicketCount > 0) {
    return fromEvent
  }

  return fromEvent
}

export function getActiveAttendees(attendees: any[] | undefined | null) {
  return (attendees || []).filter((a) => a && a.status !== 'cancelled' && a.status !== 'refunded')
}

export function getRegistrationDisplayStatus(
  regEntry: { status?: string } | null | undefined,
  attendees?: any[] | null
): string {
  if (!regEntry) return 'confirmed'
  if (regEntry.status === 'cancelled') return 'cancelled'
  if (regEntry.status === 'pending') return 'pending'

  const all = Array.isArray(attendees) ? attendees : []
  if (all.length === 0) return regEntry.status || 'confirmed'

  const active = getActiveAttendees(all)
  if (active.length === 0) return 'cancelled'
  if (active.length < all.length) return 'partially_cancelled'
  return regEntry.status || 'confirmed'
}

export function isUserRegisteredForEvent(
  event: any,
  userId: string | undefined | null,
  registrationByEventId?: Map<string, any> | null
): boolean {
  const registration = resolveUserEventRegistration(event, userId, registrationByEventId)
  if (!registration) return false
  if (registration.status === 'pending') return true
  if (registration.status !== 'confirmed') return false

  if (typeof registration.activeTicketCount === 'number') {
    return registration.activeTicketCount > 0
  }
  if (typeof registration.activeAttendeeCount === 'number') {
    return registration.activeAttendeeCount > 0
  }
  if (Array.isArray(registration.attendees) && registration.attendees.length > 0) {
    return getActiveAttendees(registration.attendees).length > 0
  }

  return true
}

export function getUserRegistrationStatus(
  event: any,
  userId: string | undefined | null,
  registrationByEventId?: Map<string, any> | null
): string | null {
  const registration = resolveUserEventRegistration(event, userId, registrationByEventId)
  return registration?.status ?? null
}

export function getCancellableAttendees(registration: { attendees?: any[] } | null | undefined) {
  return (registration?.attendees || [])
    .filter(
      (a) =>
        a &&
        a.status !== 'cancelled' &&
        a.status !== 'refunded' &&
        !a.attended &&
        a.refundStatus !== 'requested' &&
        a.refundStatus !== 'processed'
    )
    .map((a) => ({
      attendeeId: String(a._id),
      name: a.name || 'Attendee',
      phone: a.phone,
      venueName: a.venueName,
      tierName: a.tierName,
      price: a.price,
      refundStatus: a.refundStatus,
      attended: a.attended,
    }))
}

export function extractCancellableAttendeesFromApiResponse(res: any): Array<{
  attendeeId: string
  name: string
  phone?: string
  venueName?: string
  tierName?: string
  price?: number
  refundStatus?: string
  attended?: boolean
}> {
  const direct =
    res?.cancellableAttendees ||
    res?.data?.cancellableAttendees ||
    []
  if (Array.isArray(direct) && direct.length > 0) return direct
  return []
}
