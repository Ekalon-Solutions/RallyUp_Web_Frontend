'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/contexts/socket-context';
import { QuickScannerView } from '@/components/vendor/quick-scanner-view';
import { VendorAssignmentsHome } from '@/components/vendor/vendor-assignments-home';
import type { VendorActiveAssignment } from '@/lib/vendorScanTypes';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isVendor || user?.role === 'vendor') return;
    if (!isDashboardStaff) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isDashboardStaff, isLoading, isVendor, router, user?.role]);

  useEffect(() => {
    if (!socket) return;
    const handleRevoke = (payload: { assignmentId?: string }) => {
      if (!payload?.assignmentId) return;
      setRevokedIds((prev) =>
        prev.includes(payload.assignmentId!) ? prev : [...prev, payload.assignmentId!]
      );
      setActiveAssignment((current) =>
        current?.assignmentId === payload.assignmentId ? null : current
      );
    };
    socket.on('vendor:assignment-revoked', handleRevoke);
    return () => {
      socket.off('vendor:assignment-revoked', handleRevoke);
    };
  }, [socket]);

  const handleSelectAssignment = useCallback((assignment: VendorActiveAssignment) => {
    setActiveAssignment(assignment);
  }, []);

  const handleChangeAssignment = useCallback(() => {
    setActiveAssignment(null);
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
        <VendorAssignmentsHome onSelect={handleSelectAssignment} revokedAssignmentIds={revokedIds} />
      </div>
    );
  }

  return (
    <QuickScannerView
      gateVenueId={gateVenueId}
      clubId={activeAssignment?.clubId ?? clubId ?? undefined}
      activeAssignment={activeAssignment ?? undefined}
      onChangeAssignment={isVendorUser ? handleChangeAssignment : undefined}
    />
  );
}
