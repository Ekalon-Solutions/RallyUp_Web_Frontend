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
  }
}

export {};
