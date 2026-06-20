'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronRight, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { VendorActiveAssignment } from '@/lib/vendorScanTypes';

type AssignmentEvent = {
  eventId: string;
  eventTitle?: string;
  venue?: string;
  eventStartTime: string;
  activatesAt: string;
  expiresAt: string;
  isActive: boolean;
};

type AssignmentGate = {
  venueId?: string;
  venueName?: string;
  tierId?: string;
  tierName?: string;
  label: string;
  gateType?: 'general' | 'vip' | 'all';
};

type AssignmentGroup = {
  assignmentId: string;
  clubId: string;
  gateZone: string;
  gates?: AssignmentGate[];
  gateType?: 'general' | 'vip' | 'all';
  venueId?: string;
  venueName?: string;
  venueLatitude?: number;
  venueLongitude?: number;
  events: AssignmentEvent[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

type VendorAssignmentsHomeProps = {
  onSelect: (assignment: VendorActiveAssignment) => void;
  revokedAssignmentIds?: string[];
};

export function VendorAssignmentsHome({ onSelect, revokedAssignmentIds = [] }: VendorAssignmentsHomeProps) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<AssignmentGroup[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.getMyVendorAssignments();
      if (res.success && res.data) {
        setGroups(res.data);
      } else {
        setError(res.error || res.message || 'Could not load assignments');
      }
    } catch {
      setError('Could not load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (revokedAssignmentIds.length) {
      setGroups((prev) => prev.filter((g) => !revokedAssignmentIds.includes(g.assignmentId)));
    }
  }, [revokedAssignmentIds]);

  const todayRows = useMemo(() => {
    const rows: Array<{ group: AssignmentGroup; event: AssignmentEvent }> = [];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    for (const group of groups) {
      for (const event of group.events) {
        const start = new Date(event.eventStartTime);
        if (start >= startOfDay && start < endOfDay) {
          rows.push({ group, event });
        }
      }
    }
    return rows.sort(
      (a, b) =>
        new Date(a.event.eventStartTime).getTime() - new Date(b.event.eventStartTime).getTime()
    );
  }, [groups]);

  const allRows = useMemo(() => {
    const rows: Array<{ group: AssignmentGroup; event: AssignmentEvent }> = [];
    for (const group of groups) {
      for (const event of group.events) {
        rows.push({ group, event });
      }
    }
    return rows.sort(
      (a, b) =>
        new Date(a.event.eventStartTime).getTime() - new Date(b.event.eventStartTime).getTime()
    );
  }, [groups]);

  const displayRows = todayRows.length ? todayRows : allRows;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-black text-white">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <p className="text-sm text-zinc-400">Loading your assignments…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black text-white">
      <div className="border-b border-zinc-800 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-xl font-bold tracking-tight text-emerald-400">Your Assignments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Select an event to open the scanner for your gate or zone.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <p className="mb-4 rounded-md border border-red-500/50 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {displayRows.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
            <p className="font-medium text-zinc-300">No assignments for today</p>
            <p className="mt-2 text-sm text-zinc-500">
              Contact your club admin if you expected to be on gate duty.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {displayRows.map(({ group, event }) => (
              <li key={`${group.assignmentId}-${event.eventId}`}>
                <button
                  type="button"
                  disabled={!event.isActive}
                  onClick={() =>
                    onSelect({
                      assignmentId: group.assignmentId,
                      eventId: event.eventId,
                      gateZone: group.gateZone,
                      gateType: group.gateType,
                      eventTitle: event.eventTitle,
                      venue: event.venue || group.venueName,
                      venueId: group.venueId,
                      venueName: group.venueName,
                      venueLatitude: group.venueLatitude,
                      venueLongitude: group.venueLongitude,
                      clubId: group.clubId,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-left transition active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-white">
                      {event.eventTitle || 'Event'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatTime(event.eventStartTime)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {event.venue || group.venueName || group.gateZone}
                    </p>
                    {(group.gates && group.gates.length
                      ? group.gates.map((g) => g.label)
                      : group.gateZone
                        ? [group.gateZone]
                        : []
                    ).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(group.gates && group.gates.length
                          ? group.gates.map((g) => g.label)
                          : [group.gateZone]
                        ).map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                    {!event.isActive && (
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-400/90">
                        Opens {formatTime(event.activatesAt)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-emerald-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
