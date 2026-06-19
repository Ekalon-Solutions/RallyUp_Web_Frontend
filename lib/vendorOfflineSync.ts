import { apiClient } from '@/lib/api';
import { bulkCacheVendorPasses } from '@/lib/vendorScanCache';
import { ticketCacheKey } from '@/lib/parseTicketQr';
import type { VendorScanPass } from '@/lib/vendorScanTypes';

type OfflineGuestPass = {
  registrationId: string;
  attendeeId: string;
  attendeeName: string;
  assignedTierName?: string;
  assignedVenueName?: string;
  assignedVenueId?: string;
  eventTitle: string;
  eventId: string;
  attendeeCategory?: 'member' | 'guest';
  attended?: boolean;
  onPremise?: boolean;
};

function passFromOfflineGuest(entry: OfflineGuestPass): VendorScanPass {
  return {
    attendeeName: entry.attendeeName,
    assignedTierName: entry.assignedTierName,
    assignedVenueName: entry.assignedVenueName,
    assignedVenueId: entry.assignedVenueId,
    eventTitle: entry.eventTitle,
    eventId: entry.eventId,
    registrationId: entry.registrationId,
    attendeeId: entry.attendeeId,
    attended: entry.attended,
    onPremise: entry.onPremise,
    attendeeCategory: entry.attendeeCategory,
  };
}

/** Silently prefetch guest passes for offline scanning. Non-blocking. */
export async function silentSyncVendorGuestList(eventId?: string): Promise<number> {
  try {
    let targetEventId = eventId;

    if (!targetEventId) {
      const assignmentsRes = await apiClient.getMyVendorAssignments();
      const assignments = assignmentsRes.success ? assignmentsRes.data || [] : [];
      const activeEvent = assignments
        .flatMap((assignment) =>
          (assignment.events || []).map((event) => ({
            eventId: event.eventId,
            isActive: event.isActive,
          }))
        )
        .find((event) => event.isActive && event.eventId);
      targetEventId = activeEvent?.eventId || assignments[0]?.events?.[0]?.eventId;
    }

    if (!targetEventId) return 0;

    const res = await apiClient.getVendorOfflineGuestList(targetEventId);
    if (!res.success || !res.data?.passes?.length) return 0;

    const entries = (res.data.passes as OfflineGuestPass[]).map((entry) => ({
      key: ticketCacheKey(entry.registrationId, entry.attendeeId),
      pass: passFromOfflineGuest(entry),
    }));

    return bulkCacheVendorPasses(entries);
  } catch {
    return 0;
  }
}
