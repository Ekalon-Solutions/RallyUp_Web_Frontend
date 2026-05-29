"use client"

import { useEffect, useState } from "react"

export function useCheckoutRefundPolicy(
  eventId: string | undefined,
  isCheckoutOpen: boolean,
  isPaid: boolean
) {
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)

  const requiresAcknowledgment = Boolean(eventId && isPaid)

  useEffect(() => {
    if (!isCheckoutOpen || !eventId) {
      setPolicyAcknowledged(false)
      setPolicyModalOpen(false)
      return
    }
    if (requiresAcknowledgment) {
      setPolicyAcknowledged(false)
      setPolicyModalOpen(true)
    } else {
      setPolicyAcknowledged(true)
      setPolicyModalOpen(false)
    }
  }, [isCheckoutOpen, eventId, requiresAcknowledgment])

  return {
    requiresAcknowledgment,
    policyAcknowledged,
    policyModalOpen,
    setPolicyModalOpen,
    onPolicyAcknowledged: () => {
      setPolicyAcknowledged(true)
      setPolicyModalOpen(false)
    },
    payBlockedByPolicy: requiresAcknowledgment && !policyAcknowledged,
  }
}
