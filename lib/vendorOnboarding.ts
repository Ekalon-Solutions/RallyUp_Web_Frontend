const ONBOARDING_KEY_PREFIX = 'vendorOnboardingComplete:';

export function isVendorOnboardingComplete(userId?: string | null): boolean {
  if (typeof window === 'undefined' || !userId) return false;
  return localStorage.getItem(`${ONBOARDING_KEY_PREFIX}${userId}`) === '1';
}

export function markVendorOnboardingComplete(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${userId}`, '1');
}

export function clearVendorOnboardingComplete(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${ONBOARDING_KEY_PREFIX}${userId}`);
}
