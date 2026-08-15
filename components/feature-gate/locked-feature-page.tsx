"use client"

import type { ClubFeatureKey } from "@/lib/clubFeatures"

interface LockedFeaturePageProps {
  featureKey: ClubFeatureKey
  featureLabel: string
  clubId: string
  currentTier?: string
  className?: string
}

/** Hidden when the feature is off — the dashboard redirects instead of showing a modal. */
export function LockedFeaturePage(_props: LockedFeaturePageProps) {
  return null
}
