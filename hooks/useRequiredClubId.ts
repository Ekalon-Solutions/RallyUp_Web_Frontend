import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSelectedClubId } from "@/hooks/useSelectedClubId"

export function useRequiredClubId(): string | null {
  const { user, isLoading } = useAuth()
  const clubId = useSelectedClubId()

  useEffect(() => {
    if (isLoading) return
    if (!user) return
    if (user.role === "system_owner") return
    if (clubId) return
    const userAny = user as { memberships?: Array<{ club_id?: { _id?: string } | string; status?: string }> }
    const memberships = userAny?.memberships ?? []
    const activeMemberships = memberships.filter((m) => m?.status === "active")
    const uniqueClubIds = new Set<string>()
    activeMemberships.forEach((m) => {
      const club = m?.club_id
      const id = typeof club === "string" ? club : club?._id ?? null
      if (id) uniqueClubIds.add(id)
    })
    if (uniqueClubIds.size <= 1) return
    window.location.href = "/splash"
  }, [clubId, isLoading, user])

  return clubId
}

