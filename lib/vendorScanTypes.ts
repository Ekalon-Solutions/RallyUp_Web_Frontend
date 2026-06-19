export type VendorScanPass = {
  attendeeName: string;
  attendeePhoto?: string;
  assignedTierName?: string;
  assignedVenueName?: string;
  assignedVenueId?: string;
  eventTitle: string;
  eventId: string;
  registrationId: string;
  attendeeId: string;
  attended?: boolean;
  onPremise?: boolean;
  originalCheckInAt?: string;
  attendeeCategory?: 'member' | 'guest';
};

export type ScanOverlayState =
  | { type: 'idle' }
  | {
      type: 'valid';
      pass: VendorScanPass;
      scanMode?: 'check_in' | 'check_out';
    }
  | {
      type: 'error';
      code:
        | 'INVALID'
        | 'ALREADY_SCANNED'
        | 'WRONG_VENUE'
        | 'WRONG_ZONE'
        | 'ZONE_ALREADY_ENTERED'
        | 'SESSION_INVALID'
        | 'SESSION_EXPIRED'
        | 'NOT_ASSIGNED_TO_EVENT'
        | 'ASSIGNMENT_NOT_ACTIVE'
        | 'NOT_CHECKED_IN'
        | 'OFFLINE_UNKNOWN'
        | 'NETWORK';
      message: string;
      originalCheckInAt?: string;
      redirectGate?: string;
    };

export type VendorActiveAssignment = {
  assignmentId: string;
  eventId: string;
  gateZone: string;
  gateType?: 'general' | 'vip' | 'all';
  eventTitle?: string;
  venue?: string;
  venueId?: string;
  venueName?: string;
  venueLatitude?: number;
  venueLongitude?: number;
  clubId?: string;
  sessionToken?: string;
};

export const SCAN_OVERLAY_MS = 1500;

export const VENDOR_ALLOWED_DASHBOARD_PATHS = [
  '/dashboard/quick-scanner',
  '/dashboard/vendor-reports',
] as const;

export function isVendorAllowedPath(pathname: string): boolean {
  return VENDOR_ALLOWED_DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
