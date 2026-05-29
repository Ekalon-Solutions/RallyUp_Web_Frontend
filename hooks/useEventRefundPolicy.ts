"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import type { EventRefundPolicyData } from "@/lib/refund-policy"
import { useSocket } from "@/contexts/socket-context"

export function useEventRefundPolicy(eventId: string | undefined, enabled = true) {
  const [policy, setPolicy] = useState<EventRefundPolicyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { socket } = useSocket()

  const refetch = useCallback(() => {
    if (!enabled || !eventId) return
    setLoading(true)
    setError(null)
    apiClient
      .getEventRefundPolicy(eventId)
      .then((res) => {
        if (res.success && res.data) {
          setPolicy(res.data)
        } else {
          setError(res.error || "Failed to load refund policy")
          setPolicy(null)
        }
      })
      .catch(() => {
        setError("Failed to load refund policy")
        setPolicy(null)
      })
      .finally(() => setLoading(false))
  }, [eventId, enabled])

  useEffect(() => {
    if (!enabled || !eventId) {
      setPolicy(null)
      return
    }
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
          setError(res.error || "Failed to load refund policy")
          setPolicy(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load refund policy")
          setPolicy(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId, enabled])

  useEffect(() => {
    if (!socket || !eventId || !enabled) return
    const handler = (payload: { eventId?: string }) => {
      if (payload?.eventId === eventId) refetch()
    }
    socket.on("event:refund-policy-updated", handler)
    return () => {
      socket.off("event:refund-policy-updated", handler)
    }
  }, [socket, eventId, enabled, refetch])

  return { policy, loading, error, refetch }
}
