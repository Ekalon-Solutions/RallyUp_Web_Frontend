"use client"

import { useCallback, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { RefundPolicyModal } from "@/components/modals/refund-policy-modal"
import {
  isEventNonRefundable,
  showAutomaticRefundStatus,
  type EventRefundPolicyData,
} from "@/lib/refund-policy"
import { useEventRefundPolicy } from "@/hooks/useEventRefundPolicy"

type RefundPolicyBadgeProps = {
  eventId: string
  isFreeEvent?: boolean
  className?: string
  policy?: EventRefundPolicyData | null
  source?: "badge" | "checkout" | "event_detail" | "other"
  isCheckoutFlow?: boolean
  onPolicyLoaded?: (policy: EventRefundPolicyData | null) => void
}

export function RefundPolicyBadge({
  eventId,
  isFreeEvent = false,
  className,
  policy: policyProp,
  source = "badge",
  isCheckoutFlow = false,
  onPolicyLoaded,
}: RefundPolicyBadgeProps) {
  const { policy: hookPolicy, loading } = useEventRefundPolicy(
    policyProp ? undefined : eventId,
    !isFreeEvent && !policyProp
  )
  const policy = policyProp ?? hookPolicy
  const [modalOpen, setModalOpen] = useState(false)

  const openModal = useCallback(() => setModalOpen(true), [])

  if (isFreeEvent) return null

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Policy
      </Badge>
    )
  }

  if (!policy) return null

  if (showAutomaticRefundStatus(policy)) {
    return (
      <Badge variant="secondary" className={className}>
        Club cancelled — refunds processing
      </Badge>
    )
  }

  if (isEventNonRefundable(policy)) {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          aria-label="This ticket is non-refundable. View refund policy."
        >
          <Badge
            variant="destructive"
            className={`cursor-pointer hover:opacity-90 transition-opacity ${className ?? ""}`}
          >
            Non-Refundable
          </Badge>
        </button>
        <RefundPolicyModal
          eventId={eventId}
          open={modalOpen}
          onOpenChange={setModalOpen}
          isCheckoutFlow={isCheckoutFlow}
          source={source}
        />
      </>
    )
  }

  if (policy.refund_window_closed) {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          aria-label="Refund window closed. View refund policy."
        >
          <Badge variant="outline" className={`cursor-pointer ${className ?? ""}`}>
            Refund window closed
          </Badge>
        </button>
        <RefundPolicyModal
          eventId={eventId}
          open={modalOpen}
          onOpenChange={setModalOpen}
          isCheckoutFlow={isCheckoutFlow}
          source={source}
        />
      </>
    )
  }

  const label = policy.refundable ? "Refundable" : "Non-Refundable"

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        aria-label={`View refund policy — ${label}`}
      >
        <Badge
          variant="secondary"
          className={`cursor-pointer hover:opacity-90 transition-opacity ${className ?? ""}`}
        >
          {label}
        </Badge>
      </button>
      <RefundPolicyModal
        eventId={eventId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isCheckoutFlow={isCheckoutFlow}
        source={source}
      />
    </>
  )
}
