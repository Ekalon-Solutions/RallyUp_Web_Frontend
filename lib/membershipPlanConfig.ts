/**
 * Mirror of RallyUp_Backend/src/constants/membershipPlanConfig.ts.
 * Keys must stay in sync — labels are display-only and live here.
 */

/**
 * `description` is the admin-facing hint in the plan wizard.
 * `memberDescription` is the public copy shown on the club website.
 */
export const PLAN_FEATURES = [
  {
    key: 'matchday_tickets',
    label: 'Matchday Tickets',
    description: 'External Ticketing Module',
    memberDescription: 'Get priority access to tickets and enjoy exclusive member rates.',
  },
  {
    key: 'events_store_discounts',
    label: 'Events & Store Discounts',
    description: '',
    memberDescription: 'Enjoy special discounts on events, merchandise and partner offers.',
  },
  {
    key: 'news_updates',
    label: 'News & Updates',
    description: '',
    memberDescription: 'Stay informed with the latest club news, announcements and more.',
  },
  {
    key: 'polls',
    label: 'Polls',
    description: '',
    memberDescription: 'Vote in member polls and have your say in club decisions.',
  },
  {
    key: 'gallery_access',
    label: 'Gallery Access',
    description: '',
    memberDescription: 'Access exclusive photo galleries and behind-the-scenes content.',
  },
] as const

export type PlanFeatureKey = (typeof PLAN_FEATURES)[number]['key']

export const PLAN_FEATURE_KEYS = PLAN_FEATURES.map((f) => f.key) as PlanFeatureKey[]

export function defaultPlanFeatures(): Record<string, boolean> {
  return Object.fromEntries(PLAN_FEATURE_KEYS.map((k) => [k, true]))
}

export const PLAN_ATTRIBUTE_FIELDS = [
  { key: 'username', label: 'Username' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'address_line1', label: 'Address Line 1' },
  { key: 'address_line2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state_province', label: 'State / Province' },
  { key: 'zip_code', label: 'ZIP / Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'club_member_id', label: 'Club Membership ID' },
  { key: 'id_proof', label: 'ID Proof', sensitive: true },
] as const

export type PlanAttributeKey = (typeof PLAN_ATTRIBUTE_FIELDS)[number]['key']

/**
 * One option set drives both the ID proof "Input format" and the custom field
 * "Field Type" dropdowns — the design uses the same five choices for each.
 */
export const FIELD_INPUT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'alphanumeric', label: 'Alphanumeric' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
] as const

export type FieldInputType = (typeof FIELD_INPUT_TYPES)[number]['value']

export const ID_PROOF_FORMATS = FIELD_INPUT_TYPES
export type IdProofFormat = FieldInputType

export const DEFAULT_ID_PROOF_TYPES: PlanIdProofType[] = [
  { label: 'Aadhaar', format: 'numeric', maxLength: 12 },
  { label: 'Passport', format: 'alphanumeric', maxLength: 8 },
  { label: 'Driving License', format: 'alphanumeric', maxLength: 16 },
  { label: 'Voter ID', format: 'alphanumeric', maxLength: 10 },
]

/** Profiles store "Aadhar"; plans default to "Aadhaar". Same document. */
export function canonicalizeIdProofLabel(label: string): string {
  const n = label.trim().toLowerCase().replace(/['’]/g, '').replace(/\s+/g, ' ')
  if (/^aadha?r$/.test(n)) return 'aadhaar'
  if (/^voter\s*id$/.test(n) || n === 'voterid') return 'voter id'
  if (/^passport$/.test(n)) return 'passport'
  if (
    /^drivers?\s*(license|licence)$/.test(n) ||
    n === 'driving license' ||
    n === 'driving licence'
  ) {
    return 'driving license'
  }
  if (/^pan(\s*card)?$/.test(n)) return 'pan'
  return n
}

export function idProofLabelsMatch(a: string, b: string): boolean {
  return canonicalizeIdProofLabel(a) === canonicalizeIdProofLabel(b)
}

/**
 * Custom field "Field Type" — what a value *means*, which drives validation.
 * Deliberately a different list from ID_PROOF_FORMATS (which describes the
 * *shape* of an identifier): a secondary email needs 'email', while a photo ID
 * number needs 'text' so "X1234567" is accepted.
 */
export const CUSTOM_FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'dropdown', label: 'Dropdown' },
] as const

export const MAX_DROPDOWN_OPTIONS = 30

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number]['value']

export const MAX_BROCHURE_FILES = 5
/** Admin-defined checkout fields per plan. */
export const MAX_CUSTOM_FIELDS = 16

export type PlanAttributeField = { key: string; enabled: boolean; mandatory: boolean }
export type PlanIdProofType = { label: string; format: IdProofFormat; maxLength: number }
export type PlanCustomField = {
  label: string
  type: CustomFieldType
  mandatory: boolean
  options?: string[]
  sensitive?: boolean
}
export type PlanAttributes = {
  fields: PlanAttributeField[]
  idProofTypes: PlanIdProofType[]
  customFields: PlanCustomField[]
}
export type PlanBrochureFile = { url: string; name: string; size: number }

export function defaultPlanAttributes(): PlanAttributes {
  return {
    fields: PLAN_ATTRIBUTE_FIELDS.map((f) => ({ key: f.key, enabled: true, mandatory: false })),
    idProofTypes: DEFAULT_ID_PROOF_TYPES.map((t) => ({ ...t })),
    customFields: [],
  }
}

/** Fills in any field the stored plan predates, so older plans render complete. */
export function hydratePlanAttributes(raw: Partial<PlanAttributes> | null | undefined): PlanAttributes {
  const storedList = raw?.fields ?? []
  const map = new Map<string, PlanAttributeField>()
  for (const hit of storedList) {
    if (!PLAN_ATTRIBUTE_FIELDS.some((f) => f.key === hit.key)) continue
    map.set(hit.key, {
      key: hit.key,
      enabled: Boolean(hit.enabled),
      mandatory: Boolean(hit.enabled) && Boolean(hit.mandatory),
    })
  }
  const fields: PlanAttributeField[] = PLAN_ATTRIBUTE_FIELDS.map((f) => {
    const existing = map.get(f.key)
    return existing ?? { key: f.key, enabled: true, mandatory: false }
  })
  return {
    fields,
    idProofTypes: raw?.idProofTypes?.length ? raw.idProofTypes : DEFAULT_ID_PROOF_TYPES.map((t) => ({ ...t })),
    customFields: raw?.customFields ?? [],
  }
}

/** Stable snapshot so submit can detect the admin changing the form in another tab. */
export function fieldConfigSignature(attrs: Partial<PlanAttributes> | null | undefined): string {
  const a = hydratePlanAttributes(attrs)
  return JSON.stringify({
    fields: a.fields.map((f) => [f.key, f.enabled, f.mandatory]),
    idProofTypes: a.idProofTypes.map((t) => [t.label, t.format, t.maxLength]),
    customFields: a.customFields.map((f) => [f.label, f.type, f.mandatory, f.options ?? []]),
  })
}

export function reorderList<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function hydratePlanFeatures(raw: Record<string, boolean> | null | undefined): Record<string, boolean> {
  const out = defaultPlanFeatures()
  for (const key of PLAN_FEATURE_KEYS) {
    if (raw && raw[key] !== undefined) out[key] = Boolean(raw[key])
  }
  return out
}

/** Field is collected at checkout for this plan. Absent config = collect everything. */
export function isAttributeEnabled(attrs: Partial<PlanAttributes> | null | undefined, key: PlanAttributeKey): boolean {
  const hit = attrs?.fields?.find((f) => f.key === key)
  return hit ? Boolean(hit.enabled) : true
}

export function isAttributeMandatory(attrs: Partial<PlanAttributes> | null | undefined, key: PlanAttributeKey): boolean {
  const hit = attrs?.fields?.find((f) => f.key === key)
  return Boolean(hit?.enabled && hit?.mandatory)
}

/** Date-ish types render as native pickers, so no character pattern applies. */
const FORMAT_PATTERN: Partial<Record<FieldInputType, RegExp>> = {
  numeric: /^[0-9]+$/,
  alphanumeric: /^[A-Za-z0-9]+$/,
}

const DATE_TYPES: FieldInputType[] = ['date', 'datetime']

export function isDateFieldType(type: FieldInputType): boolean {
  return DATE_TYPES.includes(type)
}

/** HTML input props for a field type — shared by ID proof formats and custom fields. */
export function inputPropsForFieldType(type: FieldInputType | CustomFieldType) {
  if (type === 'date') return { type: 'date' as const }
  if (type === 'datetime') return { type: 'datetime-local' as const }
  if (type === 'email') return { type: 'email' as const }
  if (type === 'number') return { type: 'number' as const }
  if (type === 'numeric') return { type: 'text' as const, inputMode: 'numeric' as const }
  return { type: 'text' as const }
}

// ── Submission validation (mirrors services/planSubmissionValidator.ts) ─────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/

function isRealDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [, y, m, d] = match
  const parsed = new Date(`${y}-${m}-${d}T00:00:00Z`)
  if (isNaN(parsed.getTime())) return false
  // Rejects rollovers like 2026-02-31, which Date silently turns into March.
  return (
    parsed.getUTCFullYear() === Number(y) &&
    parsed.getUTCMonth() + 1 === Number(m) &&
    parsed.getUTCDate() === Number(d)
  )
}

/**
 * Client-side twin of the server validator, so a member sees the problem before
 * the request rather than as a 400. The server remains the authority.
 * An empty value passes here — presence is the caller's concern.
 */
export function validateFieldValue(
  type: CustomFieldType,
  rawValue: unknown,
  label: string
): string | null {
  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue == null ? '' : String(rawValue).trim()
  if (!value) return null

  if (type === 'email') {
    return EMAIL_PATTERN.test(value) ? null : `${label} must be a valid email address.`
  }
  if (type === 'number') {
    return Number.isFinite(Number(value)) ? null : `${label} must be a number.`
  }
  if (type === 'date') {
    return isRealDate(value) ? null : `${label} must be a valid date.`
  }
  // Text and dropdown: presence/options are checked by the caller.
  return null
}

/** Returns an error message, or null when the value fits the configured type. */
export function validateIdProofNumber(value: string, type: PlanIdProofType | undefined): string | null {
  if (!type) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (isDateFieldType(type.format)) return null
  if (trimmed.length > type.maxLength) {
    return `${type.label} cannot be longer than ${type.maxLength} characters`
  }
  const pattern = FORMAT_PATTERN[type.format]
  if (pattern && !pattern.test(trimmed)) {
    const expected = FIELD_INPUT_TYPES.find((f) => f.value === type.format)?.label ?? type.format
    return `${type.label} must be ${expected.toLowerCase()}`
  }
  return null
}

/** Shape the club website needs to render a plan's benefits and brochure. */
export type PublicPlanConfig = {
  planFeatures?: Record<string, boolean> | null
  customFeatures?: string[] | null
  brochure?: PlanBrochureFile[] | null
  memberDiscount?: PlanMemberDiscount | null
}

export type PlanBenefit = { key: string; title: string; description: string }

/** The auto-discount % for a plan, or null when it has none. */
export function visiblePlanDiscountPercent(
  plan: PublicPlanConfig | null | undefined
): number | null {
  if (!plan) return null
  const discount = hydratePlanMemberDiscount(plan.memberDiscount)
  if (discount.enabled && discount.discountType === 'percentage' && discount.discountValue > 0) {
    return Math.min(100, discount.discountValue)
  }
  return null
}

function planGrantsTicketing(plan: PublicPlanConfig | null | undefined): boolean {
  if (!plan) return true
  return !plan.planFeatures || plan.planFeatures.matchday_tickets !== false
}

/**
 * The benefit list a member sees. Discount shows the actual percentage when
 * the plan has one. Ticketing is omitted when the plan does not grant it.
 * A plan with no config predates this feature and grants everything.
 */
export function planBenefits(plan: PublicPlanConfig | null | undefined): PlanBenefit[] {
  const features = plan?.planFeatures
  const percent = visiblePlanDiscountPercent(plan)
  const ticketingOn = planGrantsTicketing(plan)

  const benefits: PlanBenefit[] = []
  for (const f of PLAN_FEATURES) {
    if (f.key === 'matchday_tickets') {
      if (!ticketingOn) continue
      benefits.push({ key: f.key, title: f.label, description: f.memberDescription })
      continue
    }
    if (f.key === 'events_store_discounts') {
      if (percent != null) {
        benefits.push({
          key: f.key,
          title: `${percent}% off events and store`,
          description: `Members on this plan get ${percent}% off events and store purchases — no coupon code needed.`,
        })
        continue
      }
      if (features && features[f.key] === false) continue
      benefits.push({ key: f.key, title: f.label, description: f.memberDescription })
      continue
    }
    if (features && features[f.key] === false) continue
    benefits.push({ key: f.key, title: f.label, description: f.memberDescription })
  }

  const perks = (plan?.customFeatures ?? []).map((c) => c.trim()).filter(Boolean)
  if (perks.length) {
    benefits.push({
      key: 'additional_perks',
      title: 'Additional Perks',
      description: perks.join(' · '),
    })
  }
  return benefits
}

// ── Member discount (mirrors the backend constants file) ────────────────────

export const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'flat', label: 'Flat amount' },
] as const

export type DiscountType = (typeof DISCOUNT_TYPES)[number]['value']

export type PlanMemberDiscount = {
  enabled: boolean
  discountType: DiscountType
  discountValue: number
  /** Ceiling for a percentage discount. 0 = uncapped. */
  maxDiscountAmount: number
  /** Discount only applies at or above this subtotal. 0 = no floor. */
  minPurchaseAmount: number
  /** How many times this plan auto-applies per member. 0 = unlimited. */
  maxUsesPerMember: number
}

export function defaultPlanMemberDiscount(): PlanMemberDiscount {
  return {
    enabled: false,
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: 0,
    minPurchaseAmount: 0,
    maxUsesPerMember: 0,
  }
}

export function hydratePlanMemberDiscount(
  raw: Partial<PlanMemberDiscount> | null | undefined
): PlanMemberDiscount {
  return { ...defaultPlanMemberDiscount(), ...(raw ?? {}) }
}
