/** Haptic feedback helpers for bouncer / vendor scanner UX. */

export function vibrateSuccess(): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(120);
}

/** Double-pulse pattern for scan errors. */
export function vibrateError(): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate([80, 60, 80]);
}

export function vibrateLight(): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(30);
}
