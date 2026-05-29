"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { getRefundPolicySummaryLine, type EventRefundPolicyData } from "@/lib/refund-policy"
import { NonRefundableBadge } from "@/components/member/non-refundable-badge"

type Props = {
  eventId: string
  policy?: EventRefundPolicyData | null
  className?: string
}

export function RefundPolicyCheckoutLine({ eventId, policy: policyProp, className }: Props) {
  const [policy, setPolicy] = useState<EventRefundPolicyData | null>(policyProp ?? null)
  const [loading, setLoading] = useState(!policyProp)

  useEffect(() => {
    if (policyProp) {
      setPolicy(policyProp)
      setLoading(false)
      return
    }
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    apiClient
      .getEventRefundPolicy(eventId)
      .then((res) => {
        if (!cancelled && res.success && res.data) setPolicy(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId, policyProp])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className ?? ""}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading refund policy…
      </div>
    )
  }

  if (!policy) return null

  const summary = getRefundPolicySummaryLine(policy)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm ${className ?? ""}`}
      role="group"
      aria-label={`Refund policy: ${summary}`}
    >
      <div>
        <span className="font-medium text-foreground">Refund Policy: </span>
        <span className={!policy.is_refund_allowed ? "font-semibold text-amber-900 dark:text-amber-100" : ""}>
          {summary}
        </span>
      </div>
      {!policy.is_refund_allowed && !policy.event_cancelled && (
        <NonRefundableBadge className="shrink-0" />
      )}
    </div>
  )
}
