export function getJointScreeningClubNames(config?: {
  homeClubName?: string
  homeTeam?: string
  partnerClubNames?: string[]
}): string[] {
  const names: string[] = []
  const home = (config?.homeClubName ?? config?.homeTeam ?? "").trim()
  if (home) names.push(home)
  for (const raw of config?.partnerClubNames ?? []) {
    const name = String(raw).trim()
    if (name && !names.includes(name)) names.push(name)
  }
  return names
}
