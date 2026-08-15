"use client"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import {
  CLUB_FEATURE_DISABLED_EVENT,
  FEATURE_LABELS,
  type ClubFeatureKey,
} from "@/lib/clubFeatures"
import { cn } from "@/lib/utils"

interface FeatureUnavailableOverlayProps {
  featureKey: ClubFeatureKey
  featureLabel: string
  clubId: string
  className?: string
}

export function FeatureUnavailableOverlay({
  featureKey,
  featureLabel,
  clubId,
  className,
}: FeatureUnavailableOverlayProps) {
  const { isEnabled, loading } = useClubFeatures(clubId)
  const [liveDisabled, setLiveDisabled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ feature?: ClubFeatureKey }>).detail
      if (detail?.feature === featureKey) setLiveDisabled(true)
    }
    window.addEventListener(CLUB_FEATURE_DISABLED_EVENT, handler)
    return () => window.removeEventListener(CLUB_FEATURE_DISABLED_EVENT, handler)
  }, [featureKey])

  const shouldShow = liveDisabled || (!loading && !isEnabled(featureKey))
  if (!shouldShow) return null

  const label = featureLabel || FEATURE_LABELS[featureKey] || "This feature"

  return (
    <div
      className={cn(
        "absolute inset-0 z-40 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-sm p-7 rounded-2xl border bg-card shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-lg">Feature not available</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {label} is not enabled for this club.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}
