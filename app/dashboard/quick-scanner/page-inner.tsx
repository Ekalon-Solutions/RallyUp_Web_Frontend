'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/contexts/socket-context';
import { QuickScannerView } from '@/components/vendor/quick-scanner-view';
import { VendorAssignmentsHome } from '@/components/vendor/vendor-assignments-home';
import type { VendorActiveAssignment } from '@/lib/vendorScanTypes';
import { apiClient } from '@/lib/api';
import { checkGeofenceDistanceMeters, GEOFENCE_WARN_METERS } from '@/lib/vendorGeofence';
import { clearVendorSession, storeVendorSession } from '@/lib/vendorSession';
import { isVendorOnboardingComplete } from '@/lib/vendorOnboarding';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickScannerPageInner() {
  const { isAuthenticated, isLoading, isVendor, isDashboardStaff, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();

  const gateVenueId = searchParams.get('gateVenueId') ?? undefined;
  const clubId =
    searchParams.get('clubId') ??
    (typeof window !== 'undefined' ? localStorage.getItem('activeClubId') : null) ??
    undefined;

  const [activeAssignment, setActiveAssignment] = useState<VendorActiveAssignment | null>(null);
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const [startingSession, setStartingSession] = useState(false);
  const [geofenceWarning, setGeofenceWarning] = useState<string | null>(null);
  const [overrideActive, setOverrideActive] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/vendor/login');
      return;
    }
    if (isVendor || user?.role === 'vendor') {
      const userId = String((user as any)?._id || '');
      if (!isVendorOnboardingComplete(userId)) {
        router.replace('/vendor/onboarding');
      }
      return;
    }
    if (!isDashboardStaff) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isDashboardStaff, isLoading, isVendor, router, user]);

  useEffect(() => {
    if (!socket) return;
    const handleRevoke = (payload: { assignmentId?: string }) => {
      if (!payload?.assignmentId) return;
      setRevokedIds((prev) =>
        prev.includes(payload.assignmentId!) ? prev : [...prev, payload.assignmentId!]
      );
      if (activeAssignment?.assignmentId === payload.assignmentId) {
        clearVendorSession();
        setActiveAssignment(null);
      }
    };
    socket.on('vendor:assignment-revoked', handleRevoke);
    return () => {
      socket.off('vendor:assignment-revoked', handleRevoke);
    };
  }, [socket, activeAssignment?.assignmentId]);

  const handleSelectAssignment = useCallback(async (assignment: VendorActiveAssignment) => {
    setStartingSession(true);
    setGeofenceWarning(null);
    try {
      const sessionRes = await apiClient.startVendorScanSession(
        assignment.assignmentId,
        assignment.eventId
      );
      if (!sessionRes.success || !sessionRes.data) {
        toast.error(sessionRes.error || sessionRes.message || 'Could not start scan session');
        return;
      }

      const session = sessionRes.data;
      storeVendorSession({
        sessionToken: session.sessionToken,
        assignmentId: assignment.assignmentId,
        eventId: assignment.eventId,
        clubId: assignment.clubId,
        expiresAt: session.expiresAt,
        venueName: session.venueName || assignment.venueName,
        gateZone: session.gateZone,
        gateType: session.gateType,
        venueLatitude: session.venueLatitude ?? assignment.venueLatitude,
        venueLongitude: session.venueLongitude ?? assignment.venueLongitude,
      });

      const lat = session.venueLatitude ?? assignment.venueLatitude;
      const lng = session.venueLongitude ?? assignment.venueLongitude;
      const geo = await checkGeofenceDistanceMeters(lat, lng);
      if (geo.tooFar && geo.distanceMeters != null) {
        setGeofenceWarning(
          `You appear to be ${geo.distanceMeters}m from the assigned venue (limit ${GEOFENCE_WARN_METERS}m). Confirm you are at the correct gate before scanning.`
        );
      }

      setOverrideActive(false);
      setActiveAssignment({
        ...assignment,
        sessionToken: session.sessionToken,
        gateZone: session.gateZone,
        gateType: session.gateType ?? assignment.gateType,
        venueName: session.venueName || assignment.venueName,
        venueId: session.venueId ?? assignment.venueId,
        venueLatitude: lat,
        venueLongitude: lng,
      });
    } finally {
      setStartingSession(false);
    }
  }, []);

  const handleChangeAssignment = useCallback(() => {
    clearVendorSession();
    setActiveAssignment(null);
    setGeofenceWarning(null);
    setOverrideActive(false);
  }, []);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  const isVendorUser = isVendor || user?.role === 'vendor';

  if (isVendorUser && !activeAssignment) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {startingSession ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            <p className="text-sm text-zinc-400">Starting match-day scan session…</p>
          </div>
        ) : (
          <VendorAssignmentsHome onSelect={handleSelectAssignment} revokedAssignmentIds={revokedIds} />
        )}
      </div>
    );
  }

  return (
    <QuickScannerView
      gateVenueId={gateVenueId ?? activeAssignment?.venueId}
      clubId={activeAssignment?.clubId ?? clubId ?? undefined}
      activeAssignment={activeAssignment ?? undefined}
      onChangeAssignment={isVendorUser ? handleChangeAssignment : undefined}
      geofenceWarning={geofenceWarning}
      overrideActive={overrideActive}
      onOverrideActivated={() => setOverrideActive(true)}
    />
  );
}
