/**
 * useSystemOwnerClubs
 *
 * Fetches the full club list for the System Owner's club picker.
 * Only fetches when the current user is a System Owner.
 * Results are memoised for the component lifetime (no pagination — SO sees all clubs).
 */

"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

export interface ClubOption {
  id: string
  name: string
}

export interface UseSystemOwnerClubsResult {
  clubs: ClubOption[]
  loading: boolean
  error: string | null
}

export function useSystemOwnerClubs(): UseSystemOwnerClubsResult {
  const { user } = useAuth()
  const isSystemOwner = user?.role === "system_owner"

  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSystemOwner) return

    let cancelled = false
    setLoading(true)

    const fetchClubs = async () => {
      try {
        const res = await apiClient.getAllClubs({ limit: 1000 })
        if (cancelled) return
        if (res.success && res.data) {
          const raw = Array.isArray((res.data as any)?.clubs)
            ? (res.data as any).clubs
            : Array.isArray(res.data)
            ? res.data as any[]
            : []
          setClubs(
            raw.map((c: any) => ({
              id: c._id ?? c.id,
              name: c.name ?? c.clubName ?? "Unnamed Club",
            }))
          )
        }
      } catch {
        if (!cancelled) setError("Failed to load clubs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClubs()
    return () => { cancelled = true }
  }, [isSystemOwner])

  return { clubs, loading, error }
}
