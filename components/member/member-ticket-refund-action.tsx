"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash } from "lucide-react"
import { useEventRefundPolicy } from "@/hooks/useEventRefundPolicy"
import { RefundWindowClosedSheet } from "@/components/member/refund-window-closed-sheet"
import {
  isEventNonRefundable,
  showAutomaticRefundStatus,
} from "@/lib/refund-policy"

type Props = {
  eventId: string
  eventIsActive?: boolean
  onRequestRefund: () => void
  loading?: boolean
  variant?: "icon" | "full"
  className?: string
}

export function MemberTicketRefundAction({
  eventId,
  eventIsActive = true,
  onRequestRefund,
  loading = false,
  variant = "icon",
  className,
}: Props) {
  const { policy, loading: policyLoading } = useEventRefundPolicy(eventId)
  const [sheetOpen, setSheetOpen] = useState(false)

  const effectivePolicy =
    policy &&
    (eventIsActive === false
      ? { ...policy, event_cancelled: true, is_refund_allowed: policy.is_refund_allowed }
      : policy)

  if (policyLoading) {
    return (
      <Button variant="outline" disabled className={className} size={variant === "icon" ? "icon" : "default"}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!effectivePolicy) {
    return (
      <Button
        variant="destructive"
        onClick={(e) => {
          e.stopPropagation()
          onRequestRefund()
        }}
        disabled={loading}
        className={className}
        title="Cancel registration"
        size={variant === "icon" ? "icon" : "default"}
      >
        {variant === "icon" ? <Trash className="w-4 h-4" /> : "Cancel ticket"}
      </Button>
    )
  }

  if (showAutomaticRefundStatus(effectivePolicy)) {
    return (
      <p
        className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-md px-2 py-1.5 text-center"
        role="status"
      >
        Automatic refund processing
      </p>
    )
  }

  if (isEventNonRefundable(effectivePolicy)) {
    return null
  }

  if (effectivePolicy.refund_window_closed) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className={`text-muted-foreground border-muted-foreground/40 bg-muted/50 hover:bg-muted ${variant === "full" ? "w-full" : ""} ${className ?? ""}`}
          onClick={(e) => {
            e.stopPropagation()
            setSheetOpen(true)
          }}
          title="Refund window closed"
        >
          Refund Window Closed
        </Button>
        <RefundWindowClosedSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          policy={effectivePolicy}
        />
      </>
    )
  }

  if (!effectivePolicy.refundable) {
    return null
  }

  return (
    <Button
      variant="destructive"
      onClick={(e) => {
        e.stopPropagation()
        onRequestRefund()
      }}
      disabled={loading}
      className={className}
      title="Request refund or cancel ticket"
      size={variant === "icon" ? "icon" : "default"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : variant === "icon" ? (
        <Trash className="w-4 h-4" />
      ) : (
        "Request Refund"
      )}
    </Button>
  )
}
