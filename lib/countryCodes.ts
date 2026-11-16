/** E.164 dial codes supported in phone login / registration flows */
export const COUNTRY_DIAL_CODES = [
  "+91",
  "+1",
  "+44",
  "+61",
  "+971",
  "+65",
  "+852",
  "+81",
  "+49",
  "+33",
  "+86",
  "+7",
  "+55",
  "+52",
  "+27",
  "+234",
  "+254",
  "+20",
  "+966",
  "+60",
  "+66",
  "+84",
  "+63",
  "+62",
  "+92",
  "+880",
  "+94",
  "+977",
  "+975",
  "+95",
  "+855",
  "+856",
  "+976",
  "+998",
  "+996",
  "+992",
  "+993",
  "+93",
  "+98",
  "+964",
  "+963",
  "+961",
  "+962",
  "+972",
  "+970",
  "+90",
  "+30",
  "+39",
  "+34",
  "+351",
] as const

const COUNTRY_NAMES: Partial<Record<(typeof COUNTRY_DIAL_CODES)[number], string>> = {
  "+91": "India",
  "+1": "US / Canada",
  "+44": "United Kingdom",
  "+61": "Australia",
  "+971": "UAE",
  "+65": "Singapore",
  "+852": "Hong Kong",
  "+81": "Japan",
  "+49": "Germany",
  "+33": "France",
  "+86": "China",
  "+7": "Russia",
  "+55": "Brazil",
  "+52": "Mexico",
  "+27": "South Africa",
  "+234": "Nigeria",
  "+254": "Kenya",
  "+20": "Egypt",
  "+966": "Saudi Arabia",
  "+60": "Malaysia",
  "+66": "Thailand",
  "+84": "Vietnam",
  "+63": "Philippines",
  "+62": "Indonesia",
  "+92": "Pakistan",
  "+880": "Bangladesh",
  "+94": "Sri Lanka",
  "+977": "Nepal",
  "+90": "Turkey",
  "+39": "Italy",
  "+34": "Spain",
  "+351": "Portugal",
}

export function countryCodeLabel(code: string): string {
  const name = COUNTRY_NAMES[code as (typeof COUNTRY_DIAL_CODES)[number]]
  return name ? `${code} (${name})` : code
}

/**
 * Digits-only local number for a phone that may carry its dial code
 * ("+44 7700 900123" -> "7700900123" for "+44"). Mirrors the backend's
 * normalizePhone (middleware/normalizePhoneBody.ts) so every checkout agrees.
 */
export function toLocalPhoneNumber(phone: string | null | undefined, countryCode: string | null | undefined): string {
  const raw = String(phone ?? "").trim()
  let digits = raw.replace(/\D/g, "")
  const hadIntlPrefix = raw.startsWith("+") || raw.startsWith("00")
  if (raw.startsWith("00")) digits = digits.slice(2)
  const cc = String(countryCode ?? "").replace(/\D/g, "")
  const looksIntl = hadIntlPrefix || digits.length > 10
  if (looksIntl && cc && digits.startsWith(cc) && digits.length - cc.length >= 6) {
    digits = digits.slice(cc.length)
  }
  return digits
}
