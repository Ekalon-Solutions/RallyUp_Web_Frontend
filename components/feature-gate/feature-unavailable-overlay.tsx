"use client"

import type { ClubFeatureKey } from "@/lib/clubFeatures"

interface FeatureUnavailableOverlayProps {
  featureKey: ClubFeatureKey
  featureLabel: string
  clubId: string
  className?: string
}

/** Hidden when the feature is off — pages/sections are omitted instead of showing a modal. */
export function FeatureUnavailableOverlay(_props: FeatureUnavailableOverlayProps) {
  return null
}
