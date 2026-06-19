export type DevicePermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export type VendorPermissionStatus = {
  camera: DevicePermissionState;
  location: DevicePermissionState;
};

async function queryPermission(name: PermissionName): Promise<DevicePermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const result = await navigator.permissions.query({ name });
    if (result.state === 'granted') return 'granted';
    if (result.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

export async function readVendorPermissionStatus(): Promise<VendorPermissionStatus> {
  const [camera, location] = await Promise.all([
    queryPermission('camera' as PermissionName),
    queryPermission('geolocation' as PermissionName),
  ]);
  return { camera, location };
}

export async function requestCameraPermission(): Promise<DevicePermissionState> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch (error: any) {
    const name = error?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied';
    return 'prompt';
  }
}

export async function requestLocationPermission(): Promise<DevicePermissionState> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => {
        if (error?.code === error.PERMISSION_DENIED) resolve('denied');
        else resolve('prompt');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

/** Best-effort deep link when permissions were previously denied. */
export function openDeviceSettings(): void {
  if (typeof window === 'undefined') return;

  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    window.location.href = 'app-settings:';
    return;
  }
  if (/Android/i.test(ua)) {
    window.location.href = 'intent://settings/#Intent;scheme=android-app;end';
    return;
  }
}

export function deviceSettingsHint(): string {
  if (typeof navigator === 'undefined') {
    return 'Open your browser or device settings and allow Camera and Location for this site.';
  }
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'Settings → Safari → Camera & Location, or tap Open Settings below if installed as an app.';
  }
  if (/Android/i.test(ua)) {
    return 'Settings → Apps → your browser → Permissions → allow Camera and Location.';
  }
  return 'Use your browser site settings to allow Camera and Location for this website.';
}
