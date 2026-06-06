"use client"

import { useState } from "react"
import { Lock, Sparkles, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UpgradeFeatureModal } from "@/components/modals/upgrade-feature-modal"
import {
  FEATURE_DESCRIPTIONS,
  FEATURE_UNLOCK_TIER,
  type ClubFeatureKey,
} from "@/lib/clubFeatures"
import { cn } from "@/lib/utils"

const FEATURE_ICONS: Partial<Record<ClubFeatureKey, string>> = {
  events: "🎟️",
  merchandise: "👕",
  news: "📰",
  gallery: "🖼️",
  polls: "📊",
  chants: "🎵",
  external_ticketing: "🎫",
  volunteer: "🤝",
  leaderboard: "🏆",
  coupons: "🏷️",
  refunds: "↩️",
  membership: "💳",
  website: "🌐",
  reporting: "📈",
  wa_marketing: "💬",
  ads: "📣",
  predictions: "⚽",
  onboarding: "🎓",
}

const TIER_COLORS: Record<string, string> = {
  Free: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  Starter: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  Pro: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300",
  Enterprise: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
}

interface LockedFeaturePageProps {
  featureKey: ClubFeatureKey
  featureLabel: string
  clubId: string
  currentTier?: string
  className?: string
}

export function LockedFeaturePage({
  featureKey,
  featureLabel,
  clubId,
  currentTier = "Free",
  className,
}: LockedFeaturePageProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const description = FEATURE_DESCRIPTIONS[featureKey]
  const unlockTier = FEATURE_UNLOCK_TIER[featureKey]
  const emoji = FEATURE_ICONS[featureKey] ?? "✨"

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-center min-h-[60vh] p-6",
          className
        )}
      >
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Illustration */}
          <div className="relative mx-auto w-fit">
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full bg-amber-400/10 scale-[2.2] blur-2xl" />
            <div className="absolute inset-0 rounded-full bg-amber-400/15 scale-[1.6] blur-xl" />
            {/* Icon container */}
            <div className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 rotate-3">
              <div className="-rotate-3 flex flex-col items-center gap-1">
                <span className="text-4xl leading-none">{emoji}</span>
                <Lock className="w-5 h-5 text-white/80" />
              </div>
            </div>
            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-2 -right-3 w-5 h-5 text-amber-400 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-orange-400 animate-pulse [animation-delay:500ms]" />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs font-bold uppercase tracking-widest border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400">
                Premium Module
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {featureLabel}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          </div>

          {/* Plan info card */}
          <div className="rounded-2xl border bg-muted/30 p-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Your current plan</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border",
                TIER_COLORS[currentTier] ?? TIER_COLORS.Free
              )}>
                {currentTier}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Unlocks with</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border",
                  TIER_COLORS[unlockTier] ?? TIER_COLORS.Pro
                )}>
                  {unlockTier} Plan
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-12 font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 border-0"
              onClick={() => setUpgradeOpen(true)}
            >
              <Lock className="w-4 h-4 mr-2" />
              Request Access
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground">
              No direct charges. A RallyUp team member will follow up with you.
            </p>
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
