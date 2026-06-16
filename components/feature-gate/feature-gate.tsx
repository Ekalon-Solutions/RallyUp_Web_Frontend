"use client"

import type { ReactNode } from "react"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import type { ClubFeatureKey } from "@/lib/clubFeatures"
import { LockedInline } from "./locked-inline"

interface FeatureGateProps {
  feature: ClubFeatureKey
  clubId: string | null | undefined
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

export function FeatureGate({ feature, clubId, children, fallback, label }: FeatureGateProps) {
  const { isEnabled, loading } = useClubFeatures(clubId)

  if (loading) return <>{children}</>

  if (!isEnabled(feature)) {
    if (fallback === null) return null
    if (fallback !== undefined) return <>{fallback}</>
    return <LockedInline label={label ?? feature} />
  }

  return <>{children}</>
}
