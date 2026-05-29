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
  rules: Array<{ daysBefore: number; refundPercentage: number }>;
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
