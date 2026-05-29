"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { RefundPolicyModal } from "@/components/modals/refund-policy-modal"
import { NonRefundableBadge } from "@/components/member/non-refundable-badge"
import {
  isEventNonRefundable,
  showAutomaticRefundStatus,
  type EventRefundPolicyData,
} from "@/lib/refund-policy"

type RefundPolicyBadgeProps = {
  eventId: string
  className?: string
  policy?: EventRefundPolicyData | null
  source?: "badge" | "checkout" | "event_detail" | "other"
  isCheckoutFlow?: boolean
  onPolicyLoaded?: (policy: EventRefundPolicyData | null) => void
}

export function RefundPolicyBadge({
  eventId,
  className,
  policy: policyProp,
  source = "badge",
  isCheckoutFlow = false,
  onPolicyLoaded,
}: RefundPolicyBadgeProps) {
  const [policy, setPolicy] = useState<EventRefundPolicyData | null>(policyProp ?? null)
  const [loading, setLoading] = useState(!policyProp)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (policyProp) {
      setPolicy(policyProp)
      setLoading(false)
    }
  }, [policyProp])

  useEffect(() => {
    if (policyProp || !eventId) return
    let cancelled = false
    setLoading(true)
    apiClient
      .getEventRefundPolicy(eventId)
      .then((res) => {
        if (cancelled) return
        const data = res.success && res.data ? res.data : null
        setPolicy(data)
        onPolicyLoaded?.(data)
      })
      .catch(() => onPolicyLoaded?.(null))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId, policyProp, onPolicyLoaded])

  const openModal = useCallback(() => setModalOpen(true), [])

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
        <NonRefundableBadge className={className} interactive onClick={openModal} />
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
