"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Shield, AlertTriangle, Clock, FileText } from "lucide-react"
import { apiClient } from "@/lib/api"
import {
  EventRefundPolicyData,
  formatHoursRemaining,
  formatTierThreshold,
  PLATFORM_REFUND_PATH,
  PLATFORM_TERMS_PATH,
  STANDARD_CLUB_POLICY_LABEL,
} from "@/lib/refund-policy"

type RefundPolicyModalProps = {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isCheckoutFlow?: boolean
  source?: "badge" | "checkout" | "event_detail" | "other"
  onAcknowledged?: () => void
}

export function RefundPolicyModal({
  eventId,
  open,
  onOpenChange,
  isCheckoutFlow = false,
  source = "badge",
  onAcknowledged,
}: RefundPolicyModalProps) {
  const [loading, setLoading] = useState(false)
  const [policy, setPolicy] = useState<EventRefundPolicyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    if (!open || !eventId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    apiClient
      .getEventRefundPolicy(eventId)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) {
          setPolicy(res.data)
        } else {
          setError(res.error || res.message || "Could not load refund policy")
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load refund policy")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, eventId])

  useEffect(() => {
    if (!open || !policy || tracked) return

    apiClient
      .trackRefundPolicyModalOpen({
        eventId: policy.eventId,
        clubId: policy.clubId,
        source,
        context: isCheckoutFlow ? "checkout" : "browse",
      })
      .catch(() => {})
      .finally(() => setTracked(true))
  }, [open, policy, tracked, source, isCheckoutFlow])

  useEffect(() => {
    if (!open) setTracked(false)
  }, [open])

  const handleUnderstand = () => {
    onAcknowledged?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg gap-0 p-0 overflow-hidden border-primary/10"
        onInteractOutside={(e) => {
          if (isCheckoutFlow) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isCheckoutFlow) e.preventDefault()
        }}
      >
        <div className="bg-gradient-to-br from-[#6668A1]/10 via-background to-background px-6 pt-8 pb-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Refund Policy
              </span>
            </div>
            <DialogTitle className="text-2xl md:text-[1.65rem] font-bold tracking-tight leading-tight text-foreground">
              {policy?.clubName ? `${policy.clubName} — Cancellations` : "Cancellation & Refunds"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {policy?.eventTitle
                ? `Terms for "${policy.eventTitle}". Club policies apply to ticket cancellations; platform fees are governed separately.`
                : "Review cancellation terms before you complete your purchase."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2 space-y-5 max-h-[min(52vh,420px)] overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-destructive py-4">{error}</p>
          )}

          {policy && !loading && (
            <>
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                {policy.refundable ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Refundable window
                        </p>
                        <p className="text-lg font-bold tracking-tight mt-1 text-foreground">
                          {formatHoursRemaining(policy.hoursRemainingToCancel)}
                        </p>
                        {policy.currentRefundPercentage > 0 && policy.currentRefundPercentage < 100 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Current tier: up to {policy.currentRefundPercentage}% of eligible ticket value
                            (excluding platform & gateway fees).
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Non-refundable
                      </p>
                      <p className="text-lg font-bold tracking-tight mt-1">Sales are Final</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        This event is outside the club&apos;s cancellation window. Cancellations may be
                        blocked and refunds are not guaranteed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(policy.rules?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Club refund schedule
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {policy.rules.map((r) => (
                      <li
                        key={`${r.hoursBefore ?? r.daysBefore * 24}-${r.refundPercentage}`}
                        className="flex justify-between gap-3 rounded-lg border px-3 py-2 bg-background"
                      >
                        <span className="text-muted-foreground">
                          {formatTierThreshold(r)}
                        </span>
                        <span className="font-semibold tabular-nums">{r.refundPercentage}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  {policy.usesStandardTemplate ? STANDARD_CLUB_POLICY_LABEL : "Club terms"}
                </p>
                <p className="text-sm leading-relaxed text-secondary whitespace-pre-wrap">
                  {policy.policyText}
                </p>
                {policy.usesStandardTemplate && (
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    Provided by Wingman Pro
                  </Badge>
                )}
              </div>

              <Separator />

              <p className="text-xs leading-relaxed text-muted-foreground">
                Club policies cover ticket cancellations. Wingman Pro platform fees, payment gateway
                charges, and taxes may be non-refundable even when a club approves a partial refund.{" "}
                <Link
                  href={PLATFORM_TERMS_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
                >
                  Global Platform Terms
                </Link>{" "}
                and our{" "}
                <Link
                  href={PLATFORM_REFUND_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
                >
                  Refund Policy
                </Link>
                .
              </p>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-5 border-t bg-muted/20 sm:justify-center">
          <Button
            type="button"
            className="w-full sm:w-auto min-w-[200px] h-11 text-base font-semibold tracking-tight"
            onClick={handleUnderstand}
            disabled={loading}
          >
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
