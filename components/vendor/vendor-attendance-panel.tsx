'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { VendorActiveAssignment } from '@/lib/vendorScanTypes';
import { ChevronDown, ChevronUp, Loader2, Users, UserPlus } from 'lucide-react';

const POLL_MS = 30_000;

type DashboardData = {
  myTotalScans: number;
  memberCheckIns: number;
  guestWalkIns: number;
  zoneTurnout: number;
  maxCapacity: number | null;
  turnoutPercent: number | null;
  recentScans: Array<{
    attendanceId: string;
    attendeeName: string;
    attendeeCategory: 'member' | 'guest';
    scannedAt: string;
    gateZone?: string;
  }>;
  syncedAt: string;
};

type VendorAttendancePanelProps = {
  activeAssignment?: VendorActiveAssignment;
  refreshKey?: number;
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function VendorAttendancePanel({
  activeAssignment,
  refreshKey = 0,
  expanded = false,
  onToggleExpanded,
}: VendorAttendancePanelProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeAssignment?.eventId) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.getVendorAttendanceDashboard({
        eventId: activeAssignment.eventId,
        assignmentId: activeAssignment.assignmentId,
        gateZone: activeAssignment.gateZone,
        clubId: activeAssignment.clubId,
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, [activeAssignment]);

  useEffect(() => {
    setLoading(true);
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load, refreshKey]);

  if (!activeAssignment) return null;

  const turnout = data?.turnoutPercent ?? 0;

  return (
    <div className="relative z-20 border-t border-zinc-800 bg-zinc-950/95">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Attendance Log
          </p>
          <p className="text-sm text-zinc-300">
            {loading && !data ? 'Syncing…' : `${data?.myTotalScans ?? 0} scans by you`}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {expanded && (
        <div className="max-h-[42vh] space-y-3 overflow-y-auto px-4 pb-4">
          {loading && !data ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Users className="h-3.5 w-3.5" />
                    Member check-ins
                  </div>
                  <p className="text-xl font-bold tabular-nums text-white">{data.memberCheckIns}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <UserPlus className="h-3.5 w-3.5" />
                    Guest walk-ins
                  </div>
                  <p className="text-xl font-bold tabular-nums text-white">{data.guestWalkIns}</p>
                </div>
              </div>

              {data.maxCapacity != null && data.maxCapacity > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Zone turnout</span>
                    <span>
                      {data.zoneTurnout} / {data.maxCapacity} ({turnout}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, turnout)}%` }}
                    />
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Recent scans
                </p>
                {data.recentScans.length === 0 ? (
                  <p className="text-sm text-zinc-500">No scans yet this session.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.recentScans.map((scan) => (
                      <li
                        key={scan.attendanceId}
                        className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {scan.attendeeName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {scan.attendeeCategory === 'member' ? 'Member' : 'Guest'} ·{' '}
                            {formatTime(scan.scannedAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-[10px] text-zinc-600">
                Synced {formatTime(data.syncedAt)} · refreshes every 30s
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
