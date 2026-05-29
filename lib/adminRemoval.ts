export const ADMIN_REMOVAL_REASONS = [
  { value: "left_club", label: "Left the Club" },
  { value: "role_change", label: "Role Change" },
  { value: "security", label: "Security Concern" },
  { value: "conduct", label: "Performance / Conduct" },
  { value: "other", label: "Other" },
] as const

export type AdminRemovalReason = (typeof ADMIN_REMOVAL_REASONS)[number]["value"]
