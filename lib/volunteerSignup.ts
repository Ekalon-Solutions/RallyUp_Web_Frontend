import type { VolunteerSlotSignup, VolunteerSignupUser } from './api';

/** Extracts the user id from a slot signup, whether `user` is populated or a bare id string. */
export function signupUserId(signup: VolunteerSlotSignup | null | undefined): string | null {
  if (!signup) return null;
  return typeof signup.user === 'string' ? signup.user : signup.user?._id ?? null;
}

/** Extracts the populated user object from a slot signup, if available. */
export function signupUser(signup: VolunteerSlotSignup | null | undefined): VolunteerSignupUser | null {
  if (!signup || typeof signup.user === 'string') return null;
  return signup.user;
}

export function findSignupByUserId(
  signups: VolunteerSlotSignup[] | null | undefined,
  userId: string | null | undefined
): VolunteerSlotSignup | undefined {
  if (!userId || !signups) return undefined;
  return signups.find((s) => signupUserId(s) === userId);
}

/** Signups that count toward slot capacity / "already signed up" checks. */
export function activeSignups(signups: VolunteerSlotSignup[] | null | undefined): VolunteerSlotSignup[] {
  return (signups ?? []).filter((s) => s.status !== 'rejected');
}
