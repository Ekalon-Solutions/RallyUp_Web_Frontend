import type { CSSProperties } from "react"

export const DEFAULT_CLUB_PRIMARY = "#3b82f6"

export function getClubPrimaryColor(settings: unknown): string {
  if (!settings) return DEFAULT_CLUB_PRIMARY
  const actualData = (settings as { data?: { designSettings?: { primaryColor?: string } } }).data || settings
  const designSettings = (actualData as { designSettings?: { primaryColor?: string } })?.designSettings
  return designSettings?.primaryColor || DEFAULT_CLUB_PRIMARY
}

export function clubActionButtonClassName() {
  return "border-transparent text-white hover:opacity-90"
}

export function clubActionButtonStyle(primaryColor?: string): CSSProperties | undefined {
  const color = primaryColor || DEFAULT_CLUB_PRIMARY
  return {
    backgroundColor: color,
    borderColor: color,
    color: "#ffffff",
  }
}
