export function findUserEventRegistration(event: any, userId: string | undefined | null) {
  if (!event || !userId) return null
  return (event.registrations || []).find(
    (r: any) => r && String(r.userId) === String(userId)
  ) ?? null
}

export function getActiveAttendees(attendees: any[] | undefined | null) {
  return (attendees || []).filter((a) => a && a.status !== 'cancelled')
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

export function isUserRegisteredForEvent(event: any, userId: string | undefined | null): boolean {
  const registration = findUserEventRegistration(event, userId)
  return Boolean(registration && registration.status === 'confirmed')
}

export function getUserRegistrationStatus(event: any, userId: string | undefined | null): string | null {
  const registration = findUserEventRegistration(event, userId)
  return registration?.status ?? null
}

export function getCancellableAttendees(registration: { attendees?: any[] } | null | undefined) {
  return (registration?.attendees || [])
    .filter(
      (a) =>
        a &&
        a.status !== 'cancelled' &&
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
