"use client"

import { useEffect, useRef, useState } from "react"

export function useCheckoutRefundPolicy(
  eventId: string | undefined,
  isCheckoutOpen: boolean,
  isPaid: boolean
) {
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const policyAcknowledgedRef = useRef(false)

  const requiresAcknowledgment = Boolean(eventId && isPaid && isCheckoutOpen)

  useEffect(() => {
    if (!isCheckoutOpen || !eventId) {
      policyAcknowledgedRef.current = false
      setPolicyAcknowledged(false)
      setPolicyModalOpen(false)
      return
    }
    if (isPaid) {
      policyAcknowledgedRef.current = false
      setPolicyAcknowledged(false)
      setPolicyModalOpen(true)
    } else {
      setPolicyModalOpen(false)
    }
  }, [isCheckoutOpen, eventId, isPaid])

  const handlePolicyModalOpenChange = (
    open: boolean,
    onDismissCheckout?: () => void
  ) => {
    if (open) {
      setPolicyModalOpen(true)
      return
    }
    setPolicyModalOpen(false)
    if (requiresAcknowledgment && !policyAcknowledgedRef.current) {
      onDismissCheckout?.()
    }
  }

  return {
    requiresAcknowledgment,
    policyAcknowledged,
    policyModalOpen,
    setPolicyModalOpen,
    handlePolicyModalOpenChange,
    onPolicyAcknowledged: () => {
      policyAcknowledgedRef.current = true
      setPolicyAcknowledged(true)
      setPolicyModalOpen(false)
    },
    payBlockedByPolicy: requiresAcknowledgment && !policyAcknowledged,
    ensureAgreed: () => {
      if (!requiresAcknowledgment || policyAcknowledgedRef.current) return true
      setPolicyModalOpen(true)
      return false
    },
  }
}
