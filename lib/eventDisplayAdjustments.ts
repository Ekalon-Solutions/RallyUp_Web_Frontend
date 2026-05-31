import type { Event } from '@/lib/api';

/** Frontend-only: reduce displayed SMAAASH occupancy (backend count unchanged). */
export const SMAAASH_DISPLAY_ATTENDEE_OFFSET = 60;

export function isSmaaashEvent(event: { title?: string } | null | undefined): boolean {
  return Boolean(event?.title && event.title.toUpperCase().includes('SMAAASH'));
}

export function getDisplayCurrentAttendees(event: {
  title?: string;
  currentAttendees?: number;
}): number {
  const raw = Math.max(0, event.currentAttendees ?? 0);
  if (!isSmaaashEvent(event)) return raw;
  return Math.max(0, raw - SMAAASH_DISPLAY_ATTENDEE_OFFSET);
}

export function applyEventDisplayAdjustments<T extends Pick<Event, 'title' | 'currentAttendees'>>(
  event: T
): T {
  if (!isSmaaashEvent(event)) return event;
  return { ...event, currentAttendees: getDisplayCurrentAttendees(event) };
}

export function applyEventsDisplayAdjustments<T extends Pick<Event, 'title' | 'currentAttendees'>>(
  events: T[]
): T[] {
  return events.map(applyEventDisplayAdjustments);
}

function looksLikeEvent(value: unknown): value is Pick<Event, 'title' | 'currentAttendees'> {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return typeof e.title === 'string' && typeof e.currentAttendees === 'number';
}

export function patchEventResponseData(endpoint: string, data: unknown): unknown {
  if (!data) return data;

  if (endpoint.includes('/registrations') || endpoint.includes('/registration/')) return data;

  if (Array.isArray(data) && data.length > 0 && looksLikeEvent(data[0])) {
    return applyEventsDisplayAdjustments(data as Event[]);
  }

  if (looksLikeEvent(data)) {
    return applyEventDisplayAdjustments(data as Event);
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (looksLikeEvent(record.event)) {
      return {
        ...record,
        event: applyEventDisplayAdjustments(record.event as Event),
      };
    }
    if (Array.isArray(record.data) && record.data.length > 0 && looksLikeEvent(record.data[0])) {
      return {
        ...record,
        data: applyEventsDisplayAdjustments(record.data as Event[]),
      };
    }
  }

  return data;
}
