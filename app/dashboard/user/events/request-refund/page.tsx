"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { isEventNonRefundable } from "@/lib/refund-policy"

function RequestRefundGuardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId") || ""

  useEffect(() => {
    if (!eventId) {
      router.replace("/dashboard/user/events")
      return
    }

    let cancelled = false

    apiClient.getEventRefundPolicy(eventId).then((res) => {
      if (cancelled) return
      const policy = res.success && res.data ? res.data : null

      if (policy?.event_cancelled) {
        router.replace(`/dashboard/user/events?eventId=${encodeURIComponent(eventId)}`)
        return
      }

      if (policy && isEventNonRefundable(policy)) {
        toast.error("Policy restriction", {
          description:
            "This event is non-refundable. You cannot request a refund for this ticket.",
          duration: 6000,
        })
        router.replace(`/dashboard/user/events?eventId=${encodeURIComponent(eventId)}`)
        return
      }

      if (policy && policy.refund_window_closed) {
        toast.error("Refund window closed", {
          description: "The club's cancellation cut-off has passed for this event.",
        })
        router.replace(`/dashboard/user/events?eventId=${encodeURIComponent(eventId)}`)
        return
      }

      router.replace(`/dashboard/user/events?eventId=${encodeURIComponent(eventId)}&refund=1`)
    })

    return () => {
      cancelled = true
    }
  }, [eventId, router])

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function RequestRefundGuardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RequestRefundGuardContent />
    </Suspense>
  )
}
