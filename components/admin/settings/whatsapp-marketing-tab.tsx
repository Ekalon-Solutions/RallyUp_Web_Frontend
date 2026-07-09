"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MessageSquare, Info, Lock } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { apiClient, WhatsAppMarketingStatus, WhatsAppMarketingTerms } from "@/lib/api"
import { WhatsAppMarketingTermsModal } from "@/components/modals/whatsapp-marketing-terms-modal"
import { WhatsAppBulkSend } from "@/components/admin/whatsapp-bulk-send"

export function WhatsAppMarketingTab() {
  const clubId = useRequiredClubId()
  const { isEnabled, loading: featuresLoading } = useClubFeatures(clubId)
  const [status, setStatus] = useState<WhatsAppMarketingStatus | null>(null)
  const [terms, setTerms] = useState<WhatsAppMarketingTerms | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [showCancelTip, setShowCancelTip] = useState(false)

  const load = useCallback(async () => {
    if (!clubId) return
    const res = await apiClient.getWhatsAppMarketingStatus(clubId)
    if (res.success && res.data) {
      setStatus(res.data.status)
      setTerms(res.data.terms)
    }
    setLoading(false)
  }, [clubId])

  const featureEnabled = isEnabled("wa_marketing")

  useEffect(() => {
    if (featuresLoading || !featureEnabled) return
    load()
  }, [load, featuresLoading, featureEnabled])

  const handleToggle = async (next: boolean) => {
    if (!clubId || !status) return

    // Enabling for the first time (or after a Terms reset) → mandatory T&C modal.
    if (next && status.needsAcceptance) {
      setShowCancelTip(false)
      setModalOpen(true)
      return
    }

    const res = await apiClient.setWhatsAppMarketingEnabled(clubId, next)
    if (res.success && res.data) {
      setStatus(res.data.status)
      toast.success(next ? "WhatsApp Marketing enabled" : "WhatsApp Marketing disabled")
    } else if (res.status === 409) {
      // Backend says consent is required — open the modal.
      setModalOpen(true)
    } else {
      toast.error(res.error || "Failed to update")
    }
  }

  const handleAccept = async () => {
    if (!clubId) return
    setAccepting(true)
    const res = await apiClient.acceptWhatsAppMarketingTerms(clubId)
    if (res.success && res.data) {
      setStatus(res.data.status)
      setModalOpen(false)
      toast.success("Terms accepted — WhatsApp Marketing enabled")
    } else {
      toast.error(res.error || "Failed to record acceptance")
    }
    setAccepting(false)
  }

  const handleCancel = () => {
    // Toggle stays OFF; show a tooltip explaining why.
    setModalOpen(false)
    setShowCancelTip(true)
  }

  const enabled = status?.enabled ?? false
  const pdfUrl = clubId ? apiClient.getWhatsAppMarketingTermsPdfUrl(clubId) : "#"

  if (!featuresLoading && !featureEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            WhatsApp Marketing
          </CardTitle>
          <CardDescription>
            This is an add-on feature not included in your current plan. Contact support to enable
            WhatsApp Marketing broadcasts for your club.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            WhatsApp Marketing
          </CardTitle>
          <CardDescription>
            Send promotional WhatsApp broadcasts to your members. Requires acceptance of the billing
            Terms & Conditions ({status ? `INR ${status.ratePerMessage} / message + ${status.gstPercent}% GST` : "INR 1.5 / message + GST"}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable WhatsApp Marketing</Label>
              <p className="text-sm text-muted-foreground">
                {status?.tcAccepted
                  ? `Terms accepted${status.lastAcceptedByName ? ` by ${status.lastAcceptedByName}` : ""}.`
                  : "Terms not yet accepted for this club."}
              </p>
            </div>

            <TooltipProvider>
              <Tooltip open={showCancelTip} onOpenChange={setShowCancelTip}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Switch
                      checked={enabled}
                      disabled={loading}
                      onCheckedChange={handleToggle}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Marketing messages cannot be sent until the Terms & Conditions are accepted.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {status && (
            <div className="flex items-center gap-2">
              <Badge variant={status.tcAccepted ? "default" : "secondary"}>
                {status.tcAccepted ? "T&C Accepted" : "T&C Pending"}
              </Badge>
              {enabled && <Badge className="bg-green-600">Active</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk send is only meaningful once the service is enabled. */}
      {clubId && status?.enabled && status?.tcAccepted && <WhatsAppBulkSend clubId={clubId} />}

      <WhatsAppMarketingTermsModal
        open={modalOpen}
        terms={terms}
        pdfUrl={pdfUrl}
        accepting={accepting}
        onAccept={handleAccept}
        onCancel={handleCancel}
      />
    </>
  )
}
