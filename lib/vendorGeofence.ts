export const GEOFENCE_WARN_METERS = 100;

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    });
  });
}

export async function checkGeofenceDistanceMeters(
  venueLat?: number,
  venueLng?: number
): Promise<{ distanceMeters: number | null; tooFar: boolean }> {
  if (venueLat == null || venueLng == null) {
    return { distanceMeters: null, tooFar: false };
  }
  try {
    const pos = await getCurrentPosition();
    const distanceMeters = haversineMeters(
      pos.coords.latitude,
      pos.coords.longitude,
      venueLat,
      venueLng
    );
    return {
      distanceMeters: Math.round(distanceMeters),
      tooFar: distanceMeters > GEOFENCE_WARN_METERS,
    };
  } catch {
    return { distanceMeters: null, tooFar: false };
  }
}
