"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"

/**
 * After a downgrade, the member may lose the ticketing feature but must still
 * open the inbox of requests they already submitted. Skip the fetch when the
 * current plan already grants ticketing — the nav is shown either way.
 */
export function useExistingExternalTicketAccess(
  clubId: string | null | undefined,
  entitled: boolean
): { hasRequests: boolean; loaded: boolean } {
  const [hasRequests, setHasRequests] = useState(false)
  const [loaded, setLoaded] = useState(entitled || !clubId)

  useEffect(() => {
    if (!clubId) {
      setHasRequests(false)
      setLoaded(true)
      return
    }
    if (entitled) {
      setHasRequests(false)
      setLoaded(true)
      return
    }

    let cancelled = false
    setLoaded(false)

    void (async () => {
      try {
        const resp = await apiClient.listMyExternalTicketRequests()
        if (cancelled) return
        const payload: any = resp.success ? resp.data : null
        const arr = Array.isArray(payload) ? payload : payload?.data
        const list = Array.isArray(arr) ? arr : []
        const forClub = list.some(
          (r: any) => String(r?.club_id?._id || r?.club_id) === String(clubId)
        )
        setHasRequests(forClub)
      } catch {
        if (!cancelled) setHasRequests(false)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clubId, entitled])

  return { hasRequests, loaded }
}
