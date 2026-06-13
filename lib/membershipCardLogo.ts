// Shared logo-scaling logic for the digital membership card.
// Used by the card renderer (live preview, mobile app ID, PDF export) and the
// admin "Logo Size Toggle" so every surface scales the logo identically.

export type LogoSize = 'small' | 'medium' | 'large'

export const LOGO_SIZES: { value: LogoSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

// Base logo dimension in px — matches the historical "medium" size (Tailwind w-8/h-8).
export const LOGO_BASE_PX = 32

// logo_scale_factor per size. "Large" increases the current (medium) logo by 150%
// per the WBS requirement; "small" shrinks it to 75%.
export const LOGO_SCALE_FACTORS: Record<LogoSize, number> = {
  small: 0.75,
  medium: 1,
  large: 1.5,
}

// Constraint-Bound: the rendered logo can never exceed this px on the card,
// guaranteeing it cannot grow large enough to obscure the member photo or the
// "Verified" badge regardless of the scale factor that gets persisted.
export const LOGO_MAX_PX = 48

export function getLogoScaleFactor(size?: LogoSize | null): number {
  return LOGO_SCALE_FACTORS[size ?? 'medium'] ?? LOGO_SCALE_FACTORS.medium
}

// Final, constraint-bound pixel dimension for the square logo.
export function getLogoDimensionPx(size?: LogoSize | null): number {
  const raw = LOGO_BASE_PX * getLogoScaleFactor(size)
  return Math.min(Math.round(raw), LOGO_MAX_PX)
}

// A logo is only available (and therefore scalable) when the card has a custom
// logo or the club has uploaded one. When false, the size toggle must be
// hidden/disabled so admins can't scale the "missing image" placeholder.
export function hasScalableLogo(opts: {
  customLogo?: string | null
  clubLogo?: string | null
}): boolean {
  return Boolean(opts.customLogo || opts.clubLogo)
}
