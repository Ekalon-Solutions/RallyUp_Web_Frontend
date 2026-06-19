'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Flashlight, FlashlightOff, SwitchCamera, ScanLine, WifiOff, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { parseTicketQr, ticketCacheKey } from '@/lib/parseTicketQr';
import { vibrateError, vibrateSuccess } from '@/lib/vendorHaptics';
import {
  cacheVendorPass,
  getCachedVendorPass,
  getSessionScanCount,
  incrementSessionScanCount,
  listPendingAttendance,
  queuePendingAttendance,
  removePendingAttendance,
} from '@/lib/vendorScanCache';
import { SCAN_OVERLAY_MS, type ScanOverlayState, type VendorActiveAssignment, type VendorScanPass } from '@/lib/vendorScanTypes';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/auth-context';

type ScanErrorCode = Extract<ScanOverlayState, { type: 'error' }>['code'];

function pickPreferredCameraId(devices: MediaDeviceInfo[], preferBack = true): string | undefined {
  if (!devices.length) return undefined;
  if (preferBack) {
    const back = devices.find((d) => /back|rear|environment/i.test(d.label));
    if (back) return back.deviceId;
  }
  return devices[0]?.deviceId;
}

function passFromPreview(data: Record<string, unknown>): VendorScanPass {
  return {
    attendeeName: String(data.attendeeName || 'Guest'),
    attendeePhoto: data.attendeePhoto ? String(data.attendeePhoto) : undefined,
    assignedTierName:
      String(data.assignedTierName || '') ||
      (Array.isArray(data.venueItems) && (data.venueItems[0] as any)?.tierName) ||
      'General Admission',
    assignedVenueName: data.assignedVenueName ? String(data.assignedVenueName) : undefined,
    assignedVenueId: data.assignedVenueId ? String(data.assignedVenueId) : undefined,
    eventTitle: String(data.eventTitle || 'Event'),
    eventId: String(data.eventId || ''),
    registrationId: String(data.registrationId || ''),
    attendeeId: String(data.attendeeId || ''),
    attended: Boolean(data.attended),
  };
}

type QuickScannerViewProps = {
  gateVenueId?: string;
  clubId?: string;
  activeAssignment?: VendorActiveAssignment;
  onChangeAssignment?: () => void;
};

export function QuickScannerView({
  gateVenueId,
  clubId,
  activeAssignment,
  onChangeAssignment,
}: QuickScannerViewProps) {
  const { logout } = useAuth();
  const online = useNetworkStatus();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  const lastRawRef = useRef('');
  const lastRawAtRef = useRef(0);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [overlay, setOverlay] = useState<ScanOverlayState>({ type: 'idle' });
  const [sessionCount, setSessionCount] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    setSessionCount(getSessionScanCount());
    if (typeof window !== 'undefined' && !sessionStorage.getItem('vendorDeviceId')) {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev-${Date.now()}`;
      sessionStorage.setItem('vendorDeviceId', id);
    }
  }, []);

  const clearOverlayTimer = () => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
  };

  const showOverlay = useCallback((next: ScanOverlayState) => {
    clearOverlayTimer();
    setOverlay(next);
    if (next.type !== 'idle') {
      overlayTimerRef.current = setTimeout(() => {
        setOverlay({ type: 'idle' });
        processingRef.current = false;
        lastRawRef.current = '';
      }, SCAN_OVERLAY_MS);
    }
  }, []);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setTorchOn(false);
  }, []);

  const applyTorch = useCallback(async (enabled: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (!caps?.torch) {
        setTorchSupported(false);
        return;
      }
      setTorchSupported(true);
      await track.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] });
      setTorchOn(enabled);
    } catch {
      setTorchSupported(false);
    }
  }, []);

  const flushPendingQueue = useCallback(async () => {
    const pending = await listPendingAttendance();
    if (!pending.length) {
      setPendingSync(0);
      return;
    }
    let remaining = 0;
    for (const item of pending) {
      try {
        const res = await apiClient.adminLogAttendance({
          registrationId: item.registrationId,
          attendeeId: item.attendeeId,
          clubId: item.clubId,
          assignmentId: item.assignmentId,
          gateZone: item.gateZone,
        });
        if (res.success) {
          await removePendingAttendance(item.key);
        } else {
          remaining++;
        }
      } catch {
        remaining++;
      }
    }
    setPendingSync(remaining);
  }, []);

  useEffect(() => {
    if (online) flushPendingQueue();
  }, [online, flushPendingQueue]);

  const processScan = useCallback(
    async (registrationId: string, attendeeId: string) => {
      const key = ticketCacheKey(registrationId, attendeeId);

      const markValid = (pass: VendorScanPass) => {
        vibrateSuccess();
        const count = incrementSessionScanCount();
        setSessionCount(count);
        showOverlay({ type: 'valid', pass });
      };

      const markError = (code: ScanErrorCode, message: string) => {
        vibrateError();
        showOverlay({ type: 'error', code, message });
      };

      if (!online) {
        const cached = await getCachedVendorPass(key);
        if (!cached) {
          markError('OFFLINE_UNKNOWN', 'TICKET NOT CACHED');
          return;
        }
        if (cached.attended) {
          markError('ALREADY_SCANNED', 'ALREADY SCANNED');
          return;
        }
        if (activeAssignment && cached.eventId !== activeAssignment.eventId) {
          markError('NOT_ASSIGNED_TO_EVENT', 'NOT ASSIGNED');
          return;
        }
        if (
          gateVenueId &&
          cached.assignedVenueId &&
          cached.assignedVenueId !== gateVenueId
        ) {
          markError('WRONG_VENUE', 'WRONG VENUE');
          return;
        }
        await queuePendingAttendance({
          key,
          registrationId,
          attendeeId,
          clubId: activeAssignment?.clubId ?? clubId,
          assignmentId: activeAssignment?.assignmentId,
          gateZone: activeAssignment?.gateZone,
          queuedAt: Date.now(),
        });
        setPendingSync((n) => n + 1);
        markValid({ ...cached, attended: true });
        return;
      }

      try {
        const previewRes = await apiClient.getVendorScanPreview(
          registrationId,
          attendeeId,
          activeAssignment?.clubId ?? clubId,
          gateVenueId
        );

        if (!previewRes.success) {
          const code = (previewRes as { code?: string }).code || (previewRes.data as any)?.code;
          if (code === 'WRONG_VENUE') {
            markError('WRONG_VENUE', 'WRONG VENUE');
            return;
          }
          if (code === 'ALREADY_SCANNED') {
            markError('ALREADY_SCANNED', 'ALREADY SCANNED');
            return;
          }
          if (code === 'NOT_ASSIGNED_TO_EVENT') {
            markError('NOT_ASSIGNED_TO_EVENT', 'NOT ASSIGNED');
            return;
          }
          if (code === 'ASSIGNMENT_NOT_ACTIVE') {
            markError('ASSIGNMENT_NOT_ACTIVE', 'NOT ACTIVE');
            return;
          }
          markError('INVALID', previewRes.error || previewRes.message || 'INVALID TICKET');
          return;
        }

        const pass = passFromPreview(previewRes.data as Record<string, unknown>);
        await cacheVendorPass(key, pass);

        if (activeAssignment && pass.eventId !== activeAssignment.eventId) {
          markError('NOT_ASSIGNED_TO_EVENT', 'NOT ASSIGNED');
          return;
        }

        if (pass.attended) {
          markError('ALREADY_SCANNED', 'ALREADY SCANNED');
          return;
        }

        const attendRes = await apiClient.adminLogAttendance({
          registrationId,
          attendeeId,
          clubId: activeAssignment?.clubId ?? clubId,
          assignmentId: activeAssignment?.assignmentId,
          gateZone: activeAssignment?.gateZone,
        });

        if (!attendRes.success) {
          const msg = attendRes.error || attendRes.message || '';
          const code = (attendRes as { code?: string }).code;
          if (code === 'NOT_ASSIGNED_TO_EVENT') {
            markError('NOT_ASSIGNED_TO_EVENT', 'NOT ASSIGNED');
            return;
          }
          if (code === 'ASSIGNMENT_NOT_ACTIVE') {
            markError('ASSIGNMENT_NOT_ACTIVE', 'NOT ACTIVE');
            return;
          }
          if (msg.toUpperCase().includes('ALREADY')) {
            markError('ALREADY_SCANNED', 'ALREADY SCANNED');
            return;
          }
          markError('INVALID', msg || 'SCAN FAILED');
          return;
        }

        markValid(pass);
      } catch {
        markError('NETWORK', 'CONNECTION ERROR');
      }
    },
    [activeAssignment, clubId, gateVenueId, online, showOverlay]
  );

  const handleRawScan = useCallback(
    (raw: string) => {
      const now = Date.now();
      if (processingRef.current) return;
      if (raw === lastRawRef.current && now - lastRawAtRef.current < 2500) return;

      const parsed = parseTicketQr(raw);
      if (!parsed) return;

      processingRef.current = true;
      lastRawRef.current = raw;
      lastRawAtRef.current = now;
      void processScan(parsed.registrationId, parsed.attendeeId);
    },
    [processScan]
  );

  const startCamera = useCallback(
    async (deviceId?: string) => {
      if (!videoRef.current) return;
      stopCamera();
      setCameraError('');

      try {
        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;
        const videoDevices = await BrowserQRCodeReader.listVideoInputDevices();
        setDevices(videoDevices);
        if (!videoDevices.length) throw new Error('No camera found');

        const idx = deviceId
          ? videoDevices.findIndex((d) => d.deviceId === deviceId)
          : cameraIndex;
        const selected = videoDevices[idx >= 0 ? idx : 0];
        const selectedId = selected?.deviceId;

        const controls = await reader.decodeFromVideoDevice(
          selectedId,
          videoRef.current,
          (result) => {
            if (result) handleRawScan(result.getText());
          }
        );

        controlsRef.current = controls;
        const stream = videoRef.current.srcObject as MediaStream | null;
        streamRef.current = stream;
        const track = stream?.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(Boolean(caps?.torch));
        setScanning(true);
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        const msg =
          e?.name === 'NotAllowedError'
            ? 'Camera permission denied'
            : e?.message || 'Could not start camera';
        setCameraError(msg);
        stopCamera();
      }
    },
    [cameraIndex, handleRawScan, stopCamera]
  );

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchCamera = () => {
    if (devices.length < 2) return;
    const next = (cameraIndex + 1) % devices.length;
    setCameraIndex(next);
    void startCamera(devices[next]?.deviceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none touch-manipulation">
      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide text-emerald-400">QUICK SCANNER</span>
          </div>
          {activeAssignment && (
            <p className="truncate text-xs text-zinc-400">
              {activeAssignment.eventTitle || 'Event'} · {activeAssignment.gateZone}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onChangeAssignment && (
            <button
              type="button"
              onClick={onChangeAssignment}
              className="text-xs text-emerald-400 underline-offset-2 hover:underline"
            >
              Assignments
            </button>
          )}
          <div className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-xs font-bold tabular-nums text-emerald-300">
            {sessionCount} scanned
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Exit
          </button>
        </div>
      </div>

      {!online && (
        <div className="relative z-20 mx-4 flex items-center justify-center gap-2 rounded-md border border-amber-500/60 bg-amber-950/90 px-3 py-2 text-center text-sm font-semibold text-amber-200">
          <WifiOff className="h-4 w-4 shrink-0" />
          Offline Mode — cached passes only
          {pendingSync > 0 && (
            <span className="ml-1 rounded bg-amber-500/30 px-1.5 text-xs">{pendingSync} pending</span>
          )}
        </div>
      )}

      {cameraError && (
        <div className="relative z-20 mx-4 mt-2 rounded-md border border-red-500/50 bg-red-950/80 px-3 py-2 text-sm text-red-200">
          {cameraError}
        </div>
      )}

      {/* Viewfinder */}
      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          aria-label="Scanner camera"
        />

        {scanning && overlay.type === 'idle' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-56 rounded-2xl border-2 border-emerald-400/80">
              <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-emerald-400" />
              <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-emerald-400" />
              <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-emerald-400" />
              <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-emerald-400" />
              <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-emerald-400/70" />
            </div>
          </div>
        )}

        {/* VALID overlay */}
        {overlay.type === 'valid' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-emerald-600 px-6 text-center animate-in fade-in duration-150">
            <p className="text-5xl font-black tracking-tighter text-white drop-shadow-lg sm:text-6xl">VALID</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              {overlay.pass.attendeePhoto ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/90 shadow-xl">
                  <Image
                    src={overlay.pass.attendeePhoto}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/90 bg-emerald-800">
                  <User className="h-12 w-12 text-white/90" />
                </div>
              )}
              <p className="text-2xl font-bold text-white">{overlay.pass.attendeeName}</p>
              <p className="text-lg font-semibold uppercase tracking-widest text-emerald-100">
                {overlay.pass.assignedTierName || 'General Admission'}
              </p>
            </div>
          </div>
        )}

        {/* ERROR overlay */}
        {overlay.type === 'error' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-700 px-6 text-center animate-in fade-in duration-100">
            <p className="text-4xl font-black tracking-tighter text-white drop-shadow-lg sm:text-5xl">
              {overlay.message}
            </p>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-red-100/90">
              Scan rejected
            </p>
          </div>
        )}
      </div>

      {/* Lower-third controls */}
      <div className="relative z-20 grid grid-cols-2 gap-3 border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!torchSupported}
          onClick={() => void applyTorch(!torchOn)}
          className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900 active:scale-[0.98] disabled:opacity-40"
        >
          {torchOn ? (
            <FlashlightOff className="h-6 w-6 text-amber-300" />
          ) : (
            <Flashlight className="h-6 w-6 text-amber-300" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
            {torchOn ? 'Torch Off' : 'Torch On'}
          </span>
        </button>
        <button
          type="button"
          disabled={devices.length < 2}
          onClick={switchCamera}
          className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900 active:scale-[0.98] disabled:opacity-40"
        >
          <SwitchCamera className="h-6 w-6 text-sky-300" />
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Switch Cam</span>
        </button>
      </div>
    </div>
  );
}
