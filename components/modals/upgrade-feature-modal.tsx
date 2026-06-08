"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import {
  FEATURE_DESCRIPTIONS,
  FEATURE_UNLOCK_TIER,
  type ClubFeatureKey,
} from "@/lib/clubFeatures"
import { toast } from "sonner"
import { Lock, Sparkles, Send, ArrowRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  featureKey: ClubFeatureKey
  featureLabel: string
}

const TIER_COLORS: Record<string, string> = {
  Free: "bg-slate-100 text-slate-700 border-slate-300",
  Starter: "bg-blue-50 text-blue-700 border-blue-200",
  Pro: "bg-violet-50 text-violet-700 border-violet-200",
  Enterprise: "bg-amber-50 text-amber-700 border-amber-200",
}

function buildPrefilledMessage(featureLabel: string, userName?: string): string {
  return `Hi Wingman Support,

I'm interested in enabling the ${featureLabel} module for our club. Could you let us know how to get this set up?

${userName ? `— ${userName}` : ""}`.trim()
}

export function UpgradeFeatureModal({
  open,
  onOpenChange,
  clubId,
  featureKey,
  featureLabel,
}: Props) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const description = FEATURE_DESCRIPTIONS[featureKey]
  const unlockTier = FEATURE_UNLOCK_TIER[featureKey]

  // Pre-fill the textarea with context when the modal opens
  const displayMessage = message || buildPrefilledMessage(featureLabel, user?.name)

  const handleOpenChange = (v: boolean) => {
    if (!v) setMessage("")
    onOpenChange(v)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await apiClient.submitFeatureUpgradeInquiry({
        clubId,
        featureKey,
        message: displayMessage,
      })
      if (res.success) {
        toast.success("Request sent!", {
          description: res.data?.message || "The RallyUp team will follow up with you shortly.",
        })
        handleOpenChange(false)
      } else {
        toast.error(res.message || "Could not send request. Please try again.")
      }
    } catch {
      toast.error("Could not send upgrade request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        {/* Premium gradient header */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 pb-8 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-4 left-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />

          <DialogHeader className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold uppercase tracking-wider border backdrop-blur-sm">
                    Premium Module
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-black text-white leading-tight">
                  Unlock {featureLabel}
                </DialogTitle>
                <p className="text-sm text-white/80 leading-relaxed max-w-xs">
                  {description}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-white/60 flex-shrink-0 mt-1 animate-pulse" />
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-card">
          {/* Tier badge */}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 border px-4 py-3">
            <span className="text-sm text-muted-foreground font-medium">Unlocks with</span>
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

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Message to Wingman support
            </label>
            <Textarea
              rows={5}
              value={message || displayMessage}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none text-sm font-medium bg-muted/30 border-muted-foreground/20 focus-visible:ring-amber-500"
              placeholder={displayMessage}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Send className="w-3 h-3" />
              Your request is forwarded to Wingman Support at RallyUp. No automatic charges are made.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 font-semibold border-2"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/25"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                "Sending…"
              ) : (
                <>
                  Send Request
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
