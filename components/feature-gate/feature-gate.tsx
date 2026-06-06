"use client"

import type { ReactNode } from "react"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import type { ClubFeatureKey } from "@/lib/clubFeatures"
import { LockedInline } from "./locked-inline"

interface FeatureGateProps {
  feature: ClubFeatureKey
  clubId: string | null | undefined
  children: ReactNode
  /**
   * Rendered when the feature is disabled. Defaults to a LockedInline pill
   * using the feature key as the label. Pass `null` to hide entirely.
   */
  fallback?: ReactNode
  label?: string
}

/**
 * Declarative feature gate for partial masking. Wraps any UI element and
 * conditionally renders it based on whether the feature is enabled for the
 * given club.
 *
 * @example
 * <FeatureGate feature="reporting" clubId={clubId} label="Export">
 *   <Button onClick={exportData}>Export CSV</Button>
 * </FeatureGate>
 */
export function FeatureGate({ feature, clubId, children, fallback, label }: FeatureGateProps) {
  const { isEnabled, loading } = useClubFeatures(clubId)

  // While loading, render children optimistically (avoids flash of locked state)
  if (loading) return <>{children}</>

  if (!isEnabled(feature)) {
    if (fallback === null) return null
    if (fallback !== undefined) return <>{fallback}</>
    return <LockedInline label={label ?? feature} />
  }

  return <>{children}</>
}
