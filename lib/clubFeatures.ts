export const CLUB_FEATURE_KEYS = [
  'events',
  'merchandise',
  'news',
  'gallery',
  'polls',
  'chants',
  'external_ticketing',
  'volunteer',
  'leaderboard',
  'coupons',
  'refunds',
  'membership',
  'website',
  'reporting',
  'wa_marketing',
  'ads',
  'predictions',
  'onboarding',
] as const;

export type ClubFeatureKey = (typeof CLUB_FEATURE_KEYS)[number];

export type ClubFeatureState = 'active' | 'inactive' | 'trial' | 'limited';

export type ResolvedFeatureFlag = {
  key: ClubFeatureKey;
  enabled: boolean;
  state: ClubFeatureState;
  label: string;
};

export type ResolvedClubFeatures = {
  clubId: string;
  features_schema_version: number;
  billing_tier: string;
  billing_status: string;
  billing_trial_ends_at?: string;
  feature_constraints: Record<string, number>;
  flags: ResolvedFeatureFlag[];
  experimental_flags: Record<string, { enabled: boolean; state: string }>;
  estimated_monthly_usd: number;
  synced_at: string;
};

export type FeatureMatrixClubRow = ResolvedClubFeatures & {
  name: string;
  slug: string;
  status: string;
};

export const ADMIN_NAV_FEATURE_MAP: Record<string, ClubFeatureKey | null> = {
  '/dashboard': null,
  '/dashboard/members': null,
  '/dashboard/events': 'events',
  '/dashboard/gallery': 'gallery',
  '/dashboard/content': 'news',
  '/dashboard/merchandise': 'merchandise',
  '/dashboard/external-ticketing': 'external_ticketing',
  '/dashboard/chants': 'chants',
  '/dashboard/polls': 'polls',
  '/dashboard/orders': 'merchandise',
  '/dashboard/leaderboard': 'leaderboard',
  '/dashboard/coupons': 'coupons',
  '/dashboard/website': 'website',
  '/dashboard/admin/refunds': 'refunds',
  '/dashboard/volunteer-management': 'volunteer',
  '/dashboard/membership-plans': 'membership',
  '/dashboard/membership-cards': 'membership',
  '/dashboard/onboarding': 'onboarding',
  '/dashboard/help': null,
  '/dashboard/admin-settings': null,
};

export function clubFeatureFlags(
  config: ResolvedClubFeatures | null | undefined
): ResolvedFeatureFlag[] {
  return config?.flags ?? [];
}

/** Ensures `flags` is always an array (stale cache / partial API payloads). */
export function normalizeResolvedClubFeatures(
  raw: Partial<ResolvedClubFeatures> | null | undefined
): ResolvedClubFeatures | null {
  if (!raw || !raw.clubId) return null;
  return {
    clubId: String(raw.clubId),
    features_schema_version: raw.features_schema_version ?? 0,
    billing_tier: raw.billing_tier ?? 'free',
    billing_status: raw.billing_status ?? 'active',
    billing_trial_ends_at: raw.billing_trial_ends_at,
    feature_constraints: raw.feature_constraints ?? {},
    flags: Array.isArray(raw.flags) ? raw.flags : [],
    experimental_flags: raw.experimental_flags ?? {},
    estimated_monthly_usd: raw.estimated_monthly_usd ?? 0,
    synced_at: raw.synced_at ?? new Date().toISOString(),
  };
}

export function isFeatureEnabled(
  config: ResolvedClubFeatures | null | undefined,
  key: ClubFeatureKey
): boolean {
  if (!config) return true;
  const flag = clubFeatureFlags(config).find((f) => f.key === key);
  // Null-safe: a flag absent from a loaded config is treated as disabled.
  return flag?.enabled ?? false;
}

export const CLUB_FEATURE_DISABLED_EVENT = 'rallyup:club-feature-disabled';

export function featureState(
  config: ResolvedClubFeatures | null | undefined,
  key: ClubFeatureKey
): ClubFeatureState {
  if (!config) return 'active';
  return clubFeatureFlags(config).find((f) => f.key === key)?.state ?? 'inactive';
}

/**
 * Returns the numeric constraint limit for a feature, or null when the
 * constraint is not set (meaning unlimited / no cap enforced).
 */
export function getFeatureConstraint(
  config: ResolvedClubFeatures | null | undefined,
  constraintKey: string
): number | null {
  if (!config) return null;
  const val = (config.feature_constraints ?? {})[constraintKey];
  return typeof val === 'number' ? val : null;
}

export const FEATURE_DEPENDENCIES: Partial<Record<ClubFeatureKey, ClubFeatureKey[]>> = {
  events: ['merchandise'],
};

/** Returns whether an experimental flag is enabled (defaults to false). */
export function isExperimentalFlagEnabled(
  config: ResolvedClubFeatures | null | undefined,
  key: string
): boolean {
  return config?.experimental_flags?.[key]?.enabled ?? false;
}

export const FEATURE_DESCRIPTIONS: Record<ClubFeatureKey, string> = {
  events: 'Create and manage events, sell tickets, and track attendance.',
  merchandise: 'Run a branded merch store with orders, inventory, and shipping.',
  news: 'Publish news articles and updates directly to your members.',
  gallery: 'Create and share photo and video albums for your club community.',
  polls: 'Run polls and surveys to gather member opinions instantly.',
  chants: 'Share and manage club chants, anthems, and crowd songs.',
  external_ticketing: 'Sell tickets to external fixtures and partner events.',
  volunteer: 'Recruit, manage, and schedule club volunteers efficiently.',
  leaderboard: 'Reward top members and fans with a live points leaderboard.',
  coupons: 'Create discount codes for events and merchandise purchases.',
  refunds: 'Process and manage refund requests from members smoothly.',
  membership: 'Sell tiered membership plans and issue branded digital cards.',
  website: "Build and customise your club's fully branded public website.",
  reporting: 'Export data, run reports, and access advanced analytics.',
  wa_marketing: 'Send targeted WhatsApp broadcast campaigns to your members.',
  ads: "Run in-app ad campaigns targeted to your club's audience.",
  predictions: 'Let members predict match scores and compete for points.',
  onboarding: 'Guide new members through a branded onboarding experience.',
};

export const FEATURE_UNLOCK_TIER: Record<ClubFeatureKey, string> = {
  events: 'Free',
  news: 'Free',
  membership: 'Free',
  website: 'Free',
  refunds: 'Free',
  gallery: 'Starter',
  polls: 'Starter',
  merchandise: 'Pro',
  chants: 'Pro',
  external_ticketing: 'Pro',
  volunteer: 'Pro',
  leaderboard: 'Pro',
  coupons: 'Pro',
  reporting: 'Pro',
  onboarding: 'Pro',
  wa_marketing: 'Enterprise',
  ads: 'Enterprise',
  predictions: 'Enterprise',
};

/** Maps a feature to the constraint key that caps its usage (if any). */
export const FEATURE_CONSTRAINT_KEY: Partial<Record<ClubFeatureKey, string>> = {
  merchandise: 'max_merch_items',
  gallery: 'max_gallery_albums',
  leaderboard: 'max_leaderboard_entries',
  coupons: 'max_coupons',
  volunteer: 'max_volunteers',
  news: 'max_news_posts',
  wa_marketing: 'max_wa_messages',
};

export const FEATURE_LABELS: Record<ClubFeatureKey, string> = {
  events:             'Events & Tickets',
  merchandise:        'Merchandise Store',
  news:               'News & Updates',
  gallery:            'Gallery',
  polls:              'Polls',
  chants:             'Club Chants',
  external_ticketing: 'External Ticketing',
  volunteer:          'Volunteer',
  leaderboard:        'Leaderboard',
  coupons:            'Coupons',
  refunds:            'Refunds',
  membership:         'Membership',
  website:            'Group Website',
  reporting:          'Reporting',
  wa_marketing:       'WhatsApp Marketing',
  ads:                'Ad Engine',
  predictions:        'Guess the Score',
  onboarding:         'Onboarding & Promotions',
};

/** Base monthly USD price per billing tier. */
export const TIER_MONTHLY_ESTIMATE_USD: Record<string, number> = {
  free:       0,
  starter:   49,
  pro:       149,
  enterprise: 399,
};

/**
 * Monthly USD price for features that can be purchased as individual add-ons
 * on top of any base tier. Matches backend billingConstants.ADDON_PRICING.
 */
export const ADDON_PRICING: Partial<Record<ClubFeatureKey, number>> = {
  wa_marketing:       49,
  ads:                29,
  predictions:        19,
  reporting:          19,
  external_ticketing: 29,
  leaderboard:        15,
  volunteer:          15,
  coupons:             9,
};

/** Mirrored from backend BILLING_TIER_PRESETS — keys included per tier. */
export const BILLING_TIER_PRESET_KEYS: Record<string, Set<ClubFeatureKey>> = {
  free:       new Set(['events', 'news', 'membership', 'website', 'refunds']),
  starter:    new Set(['events', 'news', 'gallery', 'membership', 'website', 'refunds', 'polls']),
  pro:        new Set(['events', 'merchandise', 'news', 'gallery', 'polls', 'chants', 'external_ticketing', 'volunteer', 'leaderboard', 'coupons', 'refunds', 'membership', 'website', 'reporting', 'onboarding']),
  enterprise: new Set(CLUB_FEATURE_KEYS),
};

/**
 * Compute the estimated monthly bill for a club given its current tier and
 * the effective set of enabled feature keys (including pending toggles).
 */
export function estimateMonthlyBill(
  billingTier: string,
  enabledKeys: ClubFeatureKey[]
): number {
  const base = TIER_MONTHLY_ESTIMATE_USD[billingTier] ?? 0;
  const tierEnabled = BILLING_TIER_PRESET_KEYS[billingTier] ?? new Set<ClubFeatureKey>();
  let addons = 0;
  for (const key of enabledKeys) {
    if (!tierEnabled.has(key) && ADDON_PRICING[key]) {
      addons += ADDON_PRICING[key]!;
    }
  }
  return base + addons;
}
