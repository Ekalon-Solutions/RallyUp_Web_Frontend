import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

/**
 * Firebase phone-auth stashes these on `window` between rendering the reCAPTCHA and verifying the
 * code. Declared once here: several components used to declare them independently with clashing
 * types and optionality, which TypeScript rejects as conflicting global declarations.
 */
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
    otpSessionInfo?: string;
    /** Short-lived server proof that the last OTP verified; sent with /login. */
    otpProof?: string;
  }
}

export {};
