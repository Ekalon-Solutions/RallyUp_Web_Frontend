"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { apiClient } from "@/lib/api"

export function usePrimaryClubOwner() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quota, setQuota] = useState<{ current: number; max: number | null; atLimit: boolean } | null>(null)
  const [startingRoles, setStartingRoles] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!clubId || user?.role !== "super_admin") {
        if (!cancelled) {
          setIsPrimaryOwner(false)
          setQuota(null)
          setStartingRoles([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const res = await apiClient.getMemberElevationContext(clubId)
        if (cancelled) return
        if (res.success && res.data) {
          setIsPrimaryOwner(true)
          setQuota(res.data.quota)
          setStartingRoles(res.data.startingRoles || [])
        } else {
          setIsPrimaryOwner(false)
          setQuota(null)
          setStartingRoles([])
        }
      } catch {
        if (!cancelled) {
          setIsPrimaryOwner(false)
          setQuota(null)
          setStartingRoles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [clubId, user?.role, user?._id])

  return { isPrimaryOwner, loading, quota, startingRoles, clubId }
}
