"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, ArrowLeft, Lock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UpgradeFeatureModal } from "@/components/modals/upgrade-feature-modal"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import {
  CLUB_FEATURE_DISABLED_EVENT,
  type ClubFeatureKey,
} from "@/lib/clubFeatures"
import { cn } from "@/lib/utils"

interface FeatureUnavailableOverlayProps {
  featureKey: ClubFeatureKey
  featureLabel: string
  clubId: string
  /** Extra class on the outer wrapper — must include `relative` on the parent */
  className?: string
}

/**
 * Renders an absolute overlay over its nearest `relative` ancestor when the
 * given feature is disabled — either from the initial load or from a live
 * Socket.io config-sync event (i.e., Wingman Support toggling it off mid-session).
 *
 * Place this inside a `relative` wrapper that covers the editable region.
 * The overlay blocks all pointer events below it.
 *
 * @example
 * <div className="relative">
 *   <FeatureUnavailableOverlay featureKey="merchandise" ... />
 *   <MerchandiseEditForm ... />
 * </div>
 */
export function FeatureUnavailableOverlay({
  featureKey,
  featureLabel,
  clubId,
  className,
}: FeatureUnavailableOverlayProps) {
  const { isEnabled, loading } = useClubFeatures(clubId)
  const [liveDisabled, setLiveDisabled] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Also react to the custom event dispatched by api.ts on 403 responses
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

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-40 flex items-center justify-center",
          "bg-background/75 backdrop-blur-sm rounded-inherit",
          className
        )}
        role="alertdialog"
        aria-label={`${featureLabel} is no longer available`}
      >
        <div className="flex flex-col items-center gap-5 text-center max-w-sm p-7 rounded-2xl border-2 border-destructive/20 bg-card shadow-2xl">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <div className="relative">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-destructive bg-card rounded-full p-0.5" />
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-3">
            <p className="font-black text-lg text-foreground leading-tight">
              {featureLabel} Has Been Turned Off
            </p>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed text-left">
              <p>
                This feature was <span className="font-semibold text-foreground">deactivated by your account administrator</span> while this page was open.
              </p>
              <p>
                Your existing data is safe — nothing has been deleted. However, you <span className="font-semibold text-foreground">cannot make or save any changes</span> to {featureLabel.toLowerCase()} until this feature is reactivated on your plan.
              </p>
              <p>
                To restore access, contact RallyUp support or request reactivation below.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full">
            <Button
              size="sm"
              className="w-full font-bold"
              onClick={() => setUpgradeOpen(true)}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Request Reactivation
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Go Back
            </Button>
          </div>
        </div>
      </div>

      <UpgradeFeatureModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        clubId={clubId}
        featureKey={featureKey}
        featureLabel={featureLabel}
      />
    </>
  )
}
