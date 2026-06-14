import { getBaseUrl } from '@/lib/config';

/** True when the member has uploaded their own profile photo (not empty / unset). */
export function hasCustomProfilePicture(profilePicture?: string | null): boolean {
  if (!profilePicture) return false;
  return profilePicture.trim().length > 0;
}

export function resolveProfilePictureUrl(profilePicture: string): string {
  if (
    profilePicture.startsWith('http') ||
    profilePicture.startsWith('data:') ||
    profilePicture.startsWith('blob:')
  ) {
    return profilePicture;
  }
  return `${getBaseUrl()}${profilePicture}`;
}

/** Neutral avatar used in admin card previews when showUserProfile is enabled. */
export const MEMBERSHIP_CARD_PREVIEW_PROFILE_PICTURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e2e8f0"/><circle cx="32" cy="24" r="12" fill="%2394a3b8"/><ellipse cx="32" cy="52" rx="18" ry="12" fill="%2394a3b8"/></svg>'
  );
