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
};

export type ScanOverlayState =
  | { type: 'idle' }
  | {
      type: 'valid';
      pass: VendorScanPass;
    }
  | {
      type: 'error';
      code:
        | 'INVALID'
        | 'ALREADY_SCANNED'
        | 'WRONG_VENUE'
        | 'NOT_ASSIGNED_TO_EVENT'
        | 'ASSIGNMENT_NOT_ACTIVE'
        | 'OFFLINE_UNKNOWN'
        | 'NETWORK';
      message: string;
    };

export type VendorActiveAssignment = {
  assignmentId: string;
  eventId: string;
  gateZone: string;
  eventTitle?: string;
  venue?: string;
  clubId?: string;
};

export const SCAN_OVERLAY_MS = 1500;

export const VENDOR_ALLOWED_DASHBOARD_PATHS = [
  '/dashboard/quick-scanner',
] as const;

export function isVendorAllowedPath(pathname: string): boolean {
  return VENDOR_ALLOWED_DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
