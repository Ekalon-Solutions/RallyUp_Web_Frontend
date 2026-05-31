import { useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { buildAccessibleClubs, reconcileActiveClubId } from "@/lib/clubContext"

export function useSelectedClubId(): string | null {
  const { user, activeClubId } = useAuth()

  return useMemo(() => {
    if (!user || user.role === "system_owner") return null
    const accessible = buildAccessibleClubs(user)
    return reconcileActiveClubId(activeClubId, accessible)
  }, [user, activeClubId])
}

export function useAccessibleClubs() {
  const { user } = useAuth()
  return useMemo(() => buildAccessibleClubs(user), [user])
}
