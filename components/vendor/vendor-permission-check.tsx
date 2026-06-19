'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, MapPin, Settings, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  deviceSettingsHint,
  openDeviceSettings,
  readVendorPermissionStatus,
  requestCameraPermission,
  requestLocationPermission,
  type DevicePermissionState,
  type VendorPermissionStatus,
} from '@/lib/vendorDevicePermissions';

type VendorPermissionCheckProps = {
  onReady: () => void;
};

function statusLabel(state: DevicePermissionState): string {
  if (state === 'granted') return 'Allowed';
  if (state === 'denied') return 'Blocked';
  if (state === 'unsupported') return 'Check manually';
  return 'Not yet allowed';
}

function StatusIcon({ state }: { state: DevicePermissionState }) {
  if (state === 'granted') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  if (state === 'denied') return <AlertTriangle className="h-5 w-5 text-amber-400" />;
  return null;
}

export function VendorPermissionCheck({ onReady }: VendorPermissionCheckProps) {
  const [status, setStatus] = useState<VendorPermissionStatus>({
    camera: 'prompt',
    location: 'prompt',
  });
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState<'camera' | 'location' | null>(null);

  const refresh = useCallback(async () => {
    setChecking(true);
    const next = await readVendorPermissionStatus();
    setStatus(next);
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRequestCamera = async () => {
    setRequesting('camera');
    const next = await requestCameraPermission();
    setStatus((prev) => ({ ...prev, camera: next }));
    setRequesting(null);
  };

  const handleRequestLocation = async () => {
    setRequesting('location');
    const next = await requestLocationPermission();
    setStatus((prev) => ({ ...prev, location: next }));
    setRequesting(null);
  };

  const anyDenied = status.camera === 'denied' || status.location === 'denied';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Device permissions</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Camera and location are required for scanning tickets and venue verification.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Camera className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Camera</p>
              <p className="text-xs text-zinc-500">{statusLabel(status.camera)}</p>
            </div>
          </div>
          <StatusIcon state={status.camera} />
        </div>
        {status.camera !== 'granted' && status.camera !== 'unsupported' ? (
          <Button
            type="button"
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            disabled={requesting === 'camera'}
            onClick={handleRequestCamera}
          >
            {requesting === 'camera' ? 'Requesting…' : 'Allow camera'}
          </Button>
        ) : null}

        <div className="flex items-start justify-between gap-3 pt-2">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Location</p>
              <p className="text-xs text-zinc-500">{statusLabel(status.location)}</p>
            </div>
          </div>
          <StatusIcon state={status.location} />
        </div>
        {status.location !== 'granted' && status.location !== 'unsupported' ? (
          <Button
            type="button"
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            disabled={requesting === 'location'}
            onClick={handleRequestLocation}
          >
            {requesting === 'location' ? 'Requesting…' : 'Allow location'}
          </Button>
        ) : null}
      </div>

      {anyDenied ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
          <p className="text-sm font-medium text-amber-200">Permission blocked</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{deviceSettingsHint()}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 w-full border-amber-500/40 text-amber-100 hover:bg-amber-500/10"
            onClick={openDeviceSettings}
          >
            <Settings className="mr-2 h-4 w-4" />
            Open Settings
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        className="w-full bg-white text-black hover:bg-zinc-200"
        disabled={checking || requesting !== null}
        onClick={onReady}
      >
        Continue
      </Button>
    </div>
  );
}
