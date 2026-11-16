"use client"

import type { ReactNode } from "react"
import { LockedFeaturePage } from "@/components/feature-gate"
import { ForumProvider, useForum } from "@/components/forum/forum-store"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { isFeatureEnabled } from "@/lib/clubFeatures"

const Ready = ({ children }: { children: ReactNode }) => {
  const { loading } = useForum()
  return loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading forum…</p> : <>{children}</>
}

export default function ForumLayout({ children }: { children: ReactNode }) {
  const clubId = useRequiredClubId()
  const { config } = useClubFeatures(clubId ?? null)

  if (!isFeatureEnabled(config, "forum")) {
    return <LockedFeaturePage featureKey="forum" featureLabel="Community Forum" clubId={clubId ?? ""} currentTier={config?.billing_tier} />
  }

  if (!clubId) return null

  return (
    <ForumProvider clubId={clubId}>
      <div className="space-y-6">
        <Ready>{children}</Ready>
      </div>
    </ForumProvider>
  )
}
