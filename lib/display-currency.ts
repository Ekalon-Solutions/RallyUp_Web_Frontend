/**
 * Display-currency helpers. Catalog amounts stay in their source currency;
 * this layer converts and formats for the viewer's locale.
 */

export const DEFAULT_DISPLAY_CURRENCY = "INR"
export const DEFAULT_DISPLAY_LOCALE = "en-IN"

export type CurrencySource =
  | "override"
  | "profile"
  | "ip"
  | "phone"
  | "timezone"
  | "locale"
  | "default"

export type SupportedCurrencyOption = {
  code: string
  name: string
  locale: string
}

export type DisplayCurrencySession = {
  currency: string
  locale: string
  source: CurrencySource
  country: string | null
  rates: Record<string, number>
  ratesAsOf: string
  ratesSource: "live" | "fallback"
  supported: SupportedCurrencyOption[]
  preferredCurrency: string | null
  locked: boolean
  collectableCurrencies: string[]
  chargeCurrency: string
  fxMarkupPercent: number
  fallbackNotice: string | null
}

export type CheckoutCurrencyLock = {
  currency: string
  locale: string
  rates: Record<string, number>
  ratesAsOf: string
}

export const FALLBACK_RATES_INR: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  SGD: 0.016,
  HKD: 0.093,
  AUD: 0.018,
  CAD: 0.016,
  JPY: 1.8,
  CNY: 0.087,
  CHF: 0.011,
  NZD: 0.02,
  BRL: 0.065,
  MXN: 0.23,
  ZAR: 0.22,
  SEK: 0.12,
  NOK: 0.13,
  DKK: 0.082,
  PLN: 0.047,
  TRY: 0.39,
  ILS: 0.044,
  MYR: 0.056,
  THB: 0.44,
  PHP: 0.67,
  IDR: 190,
  KRW: 16,
  SAR: 0.045,
  QAR: 0.044,
  KWD: 0.0037,
  BHD: 0.0045,
  OMR: 0.0046,
  EGP: 0.58,
  NGN: 18,
  KES: 1.55,
  PKR: 3.3,
  BDT: 1.4,
  LKR: 3.6,
  NPR: 1.6,
  VND: 300,
}

const FALLBACK_SUPPORTED: SupportedCurrencyOption[] = [
  { code: "INR", name: "Indian Rupee", locale: "en-IN" },
  { code: "USD", name: "US Dollar", locale: "en-US" },
  { code: "EUR", name: "Euro", locale: "de-DE" },
  { code: "GBP", name: "British Pound", locale: "en-GB" },
  { code: "AED", name: "UAE Dirham", locale: "ar-AE" },
  { code: "SGD", name: "Singapore Dollar", locale: "en-SG" },
  { code: "AUD", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar", locale: "en-CA" },
  { code: "JPY", name: "Japanese Yen", locale: "ja-JP" },
  { code: "HKD", name: "Hong Kong Dollar", locale: "zh-HK" },
]

export const DEFAULT_DISPLAY_SESSION: DisplayCurrencySession = {
  currency: DEFAULT_DISPLAY_CURRENCY,
  locale: DEFAULT_DISPLAY_LOCALE,
  source: "default",
  country: null,
  rates: { ...FALLBACK_RATES_INR },
  ratesAsOf: new Date(0).toISOString(),
  ratesSource: "fallback",
  supported: FALLBACK_SUPPORTED,
  preferredCurrency: null,
  locked: false,
  collectableCurrencies: ["USD", "EUR", "GBP"],
  chargeCurrency: "INR",
  fxMarkupPercent: 1,
  fallbackNotice: null,
}

let activeSession: DisplayCurrencySession = DEFAULT_DISPLAY_SESSION
const listeners = new Set<() => void>()

export function getDisplayCurrencySession(): DisplayCurrencySession {
  return activeSession
}

export function setDisplayCurrencySession(next: DisplayCurrencySession): void {
  activeSession = next
  listeners.forEach((fn) => fn())
}

export function subscribeDisplayCurrency(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function convertAmount(
  amount: number,
  fromCurrency: string | undefined,
  toCurrency: string,
  rates: Record<string, number> = activeSession.rates
): number {
  const from = (fromCurrency || DEFAULT_DISPLAY_CURRENCY).toUpperCase()
  const to = (toCurrency || DEFAULT_DISPLAY_CURRENCY).toUpperCase()
  if (!Number.isFinite(amount)) return 0
  if (from === to) return amount
  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) return amount
  return amount * (toRate / fromRate)
}

export function formatMoney(
  amount: number,
  sourceCurrency?: string,
  options?: { convert?: boolean; session?: DisplayCurrencySession }
): string {
  const session = options?.session ?? activeSession
  const source = (sourceCurrency || DEFAULT_DISPLAY_CURRENCY).toUpperCase()
  const convert = options?.convert !== false
  const displayCurrency = convert ? session.currency : source
  const displayLocale = convert ? session.locale : session.locale
  const value = convert ? convertAmount(amount, source, displayCurrency, session.rates) : amount
  try {
    return new Intl.NumberFormat(displayLocale, {
      style: "currency",
      currency: displayCurrency,
    }).format(value)
  } catch {
    return `${displayCurrency} ${Number(value).toLocaleString(displayLocale)}`
  }
}

/** Receipts / historical charges — format in the currency that was actually charged. */
export function formatChargedMoney(amount: number, chargedCurrency?: string): string {
  const code = (chargedCurrency || DEFAULT_DISPLAY_CURRENCY).toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(amount)
  } catch {
    return `${code} ${Number(amount).toLocaleString()}`
  }
}

export const GUEST_CURRENCY_PREF_KEY = "rallyup-preferred-currency"
export const CHECKOUT_CURRENCY_LOCK_KEY = "rallyup-currency-checkout-lock"

export function readGuestPreferredCurrency(): string | null {
  if (typeof window === "undefined") return null
  try {
    const value = localStorage.getItem(GUEST_CURRENCY_PREF_KEY)
    return value && value !== "AUTO" ? value.toUpperCase() : null
  } catch {
    return null
  }
}

export function writeGuestPreferredCurrency(code: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (!code || code === "AUTO") localStorage.removeItem(GUEST_CURRENCY_PREF_KEY)
    else localStorage.setItem(GUEST_CURRENCY_PREF_KEY, code.toUpperCase())
  } catch {
    /* ignore quota */
  }
}

export function readCheckoutCurrencyLock(): CheckoutCurrencyLock | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CHECKOUT_CURRENCY_LOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CheckoutCurrencyLock
    if (!parsed?.currency || !parsed?.rates) return null
    return parsed
  } catch {
    return null
  }
}

export function writeCheckoutCurrencyLock(lock: CheckoutCurrencyLock | null): void {
  if (typeof window === "undefined") return
  try {
    if (!lock) sessionStorage.removeItem(CHECKOUT_CURRENCY_LOCK_KEY)
    else sessionStorage.setItem(CHECKOUT_CURRENCY_LOCK_KEY, JSON.stringify(lock))
  } catch {
    /* ignore */
  }
}

export function applyCheckoutLockToSession(
  session: DisplayCurrencySession,
  lock: CheckoutCurrencyLock | null
): DisplayCurrencySession {
  if (!lock?.currency) return { ...session, locked: false }
  return {
    ...session,
    currency: lock.currency,
    locale: lock.locale || session.locale,
    rates: lock.rates && Object.keys(lock.rates).length > 0 ? lock.rates : session.rates,
    ratesAsOf: lock.ratesAsOf || session.ratesAsOf,
    locked: true,
  }
}

export function snapshotCheckoutLock(session: DisplayCurrencySession): CheckoutCurrencyLock {
  return {
    currency: session.currency,
    locale: session.locale,
    rates: session.rates,
    ratesAsOf: session.ratesAsOf,
  }
}
