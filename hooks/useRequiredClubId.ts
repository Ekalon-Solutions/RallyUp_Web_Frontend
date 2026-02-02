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
    window.location.href = "/splash"
  }, [clubId, isLoading, user])

  return clubId
}

