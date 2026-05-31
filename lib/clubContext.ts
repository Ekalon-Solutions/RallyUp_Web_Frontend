export type AccessibleClub = { _id: string; name: string; logo?: string }

export function normalizeClubId(club: unknown): string | null {
  if (!club) return null
  if (typeof club === "string") return club
  if (typeof club === "object" && club !== null && "_id" in club) {
    const id = (club as { _id?: unknown })._id
    return id != null ? String(id) : null
  }
  return null
}

export function buildAccessibleClubs(user: unknown): AccessibleClub[] {
  if (!user || typeof user !== "object") return []
  const userAny = user as Record<string, unknown>
  if (userAny.role === "system_owner") return []

  const list: AccessibleClub[] = []
  const push = (id: string | null, name: string, logo?: string) => {
    if (!id || list.some((x) => x._id === id)) return
    list.push({ _id: id, name, logo })
  }

  const isAdmin = userAny.role === "admin" || userAny.role === "super_admin"
  if (isAdmin && Array.isArray(userAny.clubs)) {
    for (const c of userAny.clubs) {
      const id = normalizeClubId(c)
      const name =
        typeof c === "object" && c && "name" in c && typeof (c as { name?: string }).name === "string"
          ? (c as { name: string }).name
          : "Unknown Club"
      const logo =
        typeof c === "object" && c && "logo" in c ? (c as { logo?: string }).logo : undefined
      push(id, name, logo)
    }
  }

  const memberships = Array.isArray(userAny.memberships)
    ? (userAny.memberships as unknown[]).filter(
        (m) =>
          typeof m === "object" &&
          m !== null &&
          "status" in m &&
          (m as { status: string }).status === "active",
      )
    : []

  for (const m of memberships) {
    const rec = m as Record<string, unknown>
    const club = rec.club_id ?? rec.club
    const id = normalizeClubId(club)
    const name =
      typeof club === "object" && club && "name" in club
        ? String((club as { name: string }).name)
        : "Unknown Club"
    const logo =
      typeof club === "object" && club && "logo" in club
        ? (club as { logo?: string }).logo
        : undefined
    push(id, name, logo)
  }

  return list
}

export function isClubAccessible(
  clubId: string | null | undefined,
  clubs: AccessibleClub[],
): boolean {
  if (!clubId) return false
  return clubs.some((c) => c._id === String(clubId))
}

export function reconcileActiveClubId(
  activeClubId: string | null,
  accessibleClubs: AccessibleClub[],
): string | null {
  if (accessibleClubs.length === 0) return null
  if (activeClubId && isClubAccessible(activeClubId, accessibleClubs)) return activeClubId
  return accessibleClubs[0]._id
}

export function getAccessibleClub(
  clubId: string | null | undefined,
  accessibleClubs: AccessibleClub[],
): AccessibleClub | null {
  if (!clubId) return null
  return accessibleClubs.find((c) => c._id === String(clubId)) ?? null
}
