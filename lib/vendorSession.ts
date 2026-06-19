const SESSION_KEY = 'vendorScanSessionToken';
const SESSION_META_KEY = 'vendorScanSessionMeta';

export type StoredVendorSession = {
  sessionToken: string;
  assignmentId: string;
  eventId: string;
  clubId?: string;
  expiresAt: string;
  venueName?: string;
  gateZone: string;
  gateType?: string;
  venueLatitude?: number;
  venueLongitude?: number;
};

export function storeVendorSession(session: StoredVendorSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, session.sessionToken);
  sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(session));
}

export function getVendorSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function getVendorSessionMeta(): StoredVendorSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredVendorSession;
  } catch {
    return null;
  }
}

export function clearVendorSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_META_KEY);
}
