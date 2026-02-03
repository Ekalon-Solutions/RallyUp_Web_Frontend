import { useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"

export function useSelectedClubId(): string | null {
  const { user, activeClubId } = useAuth()

  return useMemo(() => {
    if (!user || user.role === "system_owner") return null

    const userAny: any = user
    const memberships = Array.isArray(userAny?.memberships) ? userAny.memberships : []

    const normalizeClubId = (club: any): string | null => {
      if (!club) return null
      if (typeof club === "string") return club
      if (club?._id) return String(club._id)
      return null
    }

    const activeMembershipFor = (clubId: string) =>
      memberships.find(
        (m: any) => (normalizeClubId(m?.club_id) === clubId || normalizeClubId(m?.club) === clubId) && m?.status === "active",
      )

    if (activeClubId) {
      const directClubId = normalizeClubId(userAny?.club)
      if (directClubId && directClubId === activeClubId) return activeClubId
      if (activeMembershipFor(activeClubId)) return activeClubId
    }

    const directClubId = normalizeClubId(userAny?.club)
    if (directClubId) return directClubId

    const firstActive = memberships.find((m: any) => m?.status === "active")
    return normalizeClubId(firstActive?.club_id) || normalizeClubId(firstActive?.club) || null
  }, [user, activeClubId])
}

