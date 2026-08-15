"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FEATURE_DESCRIPTIONS, FEATURE_LABELS, type ClubFeatureKey } from "@/lib/clubFeatures"
import { cn } from "@/lib/utils"

interface LockedFeaturePageProps {
  featureKey?: ClubFeatureKey
  featureLabel?: string
  clubId?: string
  currentTier?: string
  className?: string
  reason?: "feature" | "permission"
}

export function LockedFeaturePage({
  featureKey,
  featureLabel,
  className,
  reason = "feature",
}: LockedFeaturePageProps) {
  const label =
    featureLabel ||
    (featureKey ? FEATURE_LABELS[featureKey] : undefined) ||
    "This page"
  const description = featureKey ? FEATURE_DESCRIPTIONS[featureKey] : undefined
  const isPermission = reason === "permission"

  return (
    <div
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-4 py-12",
        className
      )}
    >
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center border">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {isPermission ? "Access not available" : "Feature not available"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isPermission
              ? `You do not have permission to view ${label}. Ask a club owner to grant access if you need it.`
              : `${label} is not enabled for this club.`}
          </p>
          {!isPermission && description && (
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}
