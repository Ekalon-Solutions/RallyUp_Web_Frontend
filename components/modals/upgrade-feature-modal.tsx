"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { ClubFeatureKey } from "@/lib/clubFeatures"
import { toast } from "sonner"
import { Lock } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  featureKey: ClubFeatureKey
  featureLabel: string
}

export function UpgradeFeatureModal({
  open,
  onOpenChange,
  clubId,
  featureKey,
  featureLabel,
}: Props) {
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await apiClient.submitFeatureUpgradeInquiry({
        clubId,
        featureKey,
        message: message.trim() || undefined,
      })
      if (res.success) {
        toast.success(res.data?.message || "Request sent to RallyUp support.")
        onOpenChange(false)
        setMessage("")
      } else {
        toast.error(res.message || "Could not send request")
      }
    } catch {
      toast.error("Could not send upgrade request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Upgrade to unlock
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{featureLabel}</span> is not included in your
            club&apos;s current plan. Send a request to RallyUp and we&apos;ll follow up about enabling it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="upgrade-message">Message (optional)</Label>
          <Textarea
            id="upgrade-message"
            placeholder="Tell us why you need this module…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Contact RallyUp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
