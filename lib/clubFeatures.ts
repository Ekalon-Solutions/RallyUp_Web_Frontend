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

export function isFeatureEnabled(
  config: ResolvedClubFeatures | null | undefined,
  key: ClubFeatureKey
): boolean {
  if (!config) return true;
  const flag = config.flags.find((f) => f.key === key);
  return flag?.enabled ?? true;
}

export const CLUB_FEATURE_DISABLED_EVENT = 'rallyup:club-feature-disabled';

export function featureState(
  config: ResolvedClubFeatures | null | undefined,
  key: ClubFeatureKey
): ClubFeatureState {
  if (!config) return 'active';
  return config.flags.find((f) => f.key === key)?.state ?? 'inactive';
}
