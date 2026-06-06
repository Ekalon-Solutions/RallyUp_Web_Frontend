/**
 * Centralized constraint definitions to prevent mapping mismatches
 * across billing-settings, club-feature-sheet, and feature-limits-tab
 */

export const CONSTRAINT_KEYS = [
  "max_merch_items",
  "max_gallery_albums",
  "max_leaderboard_entries",
  "max_coupons",
  "max_volunteers",
  "max_news_posts",
  "max_wa_messages",
] as const

export const CONSTRAINT_LABELS: Record<string, string> = {
  max_merch_items:         "Max Merchandise Items",
  max_gallery_albums:      "Max Gallery Albums",
  max_leaderboard_entries: "Max Leaderboard Entries",
  max_coupons:             "Max Coupons",
  max_volunteers:          "Max Volunteers",
  max_news_posts:          "Max News Posts",
  max_wa_messages:         "Max WhatsApp Messages / Month",
}

/**
 * Shorter labels for display in tables/sheets where space is limited
 */
export const CONSTRAINT_LABELS_SHORT: Record<string, string> = {
  max_merch_items:         "Max Items",
  max_gallery_albums:      "Max Albums",
  max_leaderboard_entries: "Max Entries",
  max_coupons:             "Max Coupons",
  max_volunteers:          "Max Volunteers",
  max_news_posts:          "Max Posts",
  max_wa_messages:         "Max WA Msgs / mo",
}

/**
 * Get label for constraint key, with fallback to short version if specified
 */
export function getConstraintLabel(key: string, short = false): string {
  return (short ? CONSTRAINT_LABELS_SHORT[key] : CONSTRAINT_LABELS[key]) ?? key
}
