export const STANDARD_CLUB_POLICY_LABEL = 'Standard Club Policy';

export const PLATFORM_TERMS_PATH = '/terms';
export const PLATFORM_REFUND_PATH = '/refund';

export function formatHoursRemaining(hours: number | null): string {
  if (hours == null) return '';
  if (hours <= 0) return 'Cancellation window has closed';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} remaining to cancel`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days} day${days === 1 ? '' : 's'} remaining to cancel`;
  return `${days} day${days === 1 ? '' : 's'} and ${rem} hour${rem === 1 ? '' : 's'} remaining to cancel`;
}

/** A refund tier threshold supporting either a days or hours unit. */
export type RefundTierThreshold = {
  daysBefore?: number;
  hoursBefore?: number;
  unit?: 'days' | 'hours';
};

/** Canonical threshold in hours (tolerant of legacy day-only tiers). */
export function tierThresholdHours(tier: RefundTierThreshold): number {
  if (tier.hoursBefore != null && Number.isFinite(tier.hoursBefore)) {
    return Math.max(0, Math.round(tier.hoursBefore));
  }
  return Math.max(0, Math.round(Number(tier.daysBefore) || 0)) * 24;
}

/** The display unit for a tier (explicit, else inferred from the hours). */
export function tierDisplayUnit(tier: RefundTierThreshold): 'days' | 'hours' {
  if (tier.unit === 'hours') return 'hours';
  if (tier.unit === 'days') return 'days';
  return tierThresholdHours(tier) % 24 === 0 ? 'days' : 'hours';
}

/** The display value in the tier's own unit (e.g. 3 for "3 days", 12 for "12 hours"). */
export function tierThresholdValue(tier: RefundTierThreshold): number {
  const hours = tierThresholdHours(tier);
  return tierDisplayUnit(tier) === 'days' ? Math.round(hours / 24) : hours;
}

/**
 * Member-facing threshold label honouring the admin-selected unit, e.g.
 * "3 days before start", "12 hours before start", "Day of event".
 */
export function formatTierThreshold(tier: RefundTierThreshold, suffix = 'before start'): string {
  const value = tierThresholdValue(tier);
  if (tierDisplayUnit(tier) === 'days') {
    return value === 0 ? 'Day of event' : `${value}+ day${value === 1 ? '' : 's'} ${suffix}`;
  }
  return value === 0 ? 'At event start' : `${value}+ hour${value === 1 ? '' : 's'} ${suffix}`;
}

export type EventRefundPolicyData = {
  eventId: string;
  clubId: string;
  clubName: string;
  eventTitle: string;
  eventStartTime?: string;
  is_refund_allowed: boolean;
  grandfathered_purchase?: boolean;
  refundable: boolean;
  refund_window_closed?: boolean;
  event_cancelled?: boolean;
  policySummaryLine?: string;
  currentRefundPercentage: number;
  hoursRemainingToCancel: number | null;
  cancelCutoffAt: string | null;
  policyText: string;
  usesStandardTemplate: boolean;
  rules: Array<{ daysBefore: number; hoursBefore?: number; unit?: 'days' | 'hours'; refundPercentage: number }>;
  platformTermsUrl: string;
};

export function getRefundPolicySummaryLine(policy: EventRefundPolicyData): string {
  if (policy.policySummaryLine) return policy.policySummaryLine;
  if (!policy.is_refund_allowed) return 'Non-Refundable';
  if (policy.refund_window_closed) return 'Refund window closed';
  if (policy.hoursRemainingToCancel != null && policy.hoursRemainingToCancel > 0) {
    return `Refundable until ${policy.hoursRemainingToCancel} hours before event`;
  }
  return policy.refundable ? 'Refundable per club policy' : 'Non-Refundable';
}

export function isEventNonRefundable(policy: EventRefundPolicyData): boolean {
  if (policy.event_cancelled) return false;
  if (policy.grandfathered_purchase || policy.refundable) return false;
  return policy.is_refund_allowed === false;
}

export function showAutomaticRefundStatus(policy: EventRefundPolicyData): boolean {
  return Boolean(policy.event_cancelled);
}
