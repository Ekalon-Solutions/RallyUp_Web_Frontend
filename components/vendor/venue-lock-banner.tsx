'use client';

import { MapPin, ShieldAlert } from 'lucide-react';
import type { VendorActiveAssignment } from '@/lib/vendorScanTypes';

type VenueLockBannerProps = {
  assignment?: VendorActiveAssignment;
  geofenceWarning?: string | null;
  overrideActive?: boolean;
  onRequestOverride?: () => void;
};

export function VenueLockBanner({
  assignment,
  geofenceWarning,
  overrideActive,
  onRequestOverride,
}: VenueLockBannerProps) {
  if (!assignment) return null;

  const venueLabel =
    assignment.venueName || assignment.venue || 'Assigned venue';

  return (
    <div className="relative z-20 border-b border-emerald-500/30 bg-emerald-950/90 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
            Venue Lock Active
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-base font-bold text-white">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
            {venueLabel}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-emerald-200">
            Gate: {assignment.gateZone}
            {assignment.gateType && assignment.gateType !== 'all'
              ? ` · ${assignment.gateType === 'vip' ? 'VIP' : 'General'} entry`
              : ''}
          </p>
        </div>
        {onRequestOverride && (
          <button
            type="button"
            onClick={onRequestOverride}
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Override
          </button>
        )}
      </div>
      {overrideActive && (
        <p className="mt-2 text-xs font-medium text-amber-300">Override active — locks lifted</p>
      )}
      {geofenceWarning && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {geofenceWarning}
        </p>
      )}
    </div>
  );
}
