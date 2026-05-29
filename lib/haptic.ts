export function hapticSelection(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(12)
  } catch {
  }
}
