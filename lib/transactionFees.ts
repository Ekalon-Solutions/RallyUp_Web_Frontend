export const PLATFORM_FEE_PERCENT = 5
export const RAZORPAY_FEE_PERCENT = 2
export const GST_PERCENT = 18

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function calculateFeeWithGst(baseAmount: number, feePercent: number) {
  const rawFee = (baseAmount * feePercent) / 100
  const totalWithGst = roundMoney(rawFee * (1 + GST_PERCENT / 100))
  const fee = roundMoney(rawFee)

  return {
    fee,
    gst: roundMoney(totalWithGst - fee),
    totalWithGst,
  }
}

export interface TransactionFeesBreakdown {
  baseAmount: number
  platformFee: number
  platformFeeGst: number
  razorpayFee: number
  razorpayFeeGst: number
  totalFees: number
  finalAmount: number
}

/**
 * How a paid event's PG + Platform fees are handled.
 * - `pass_to_buyer` (default): fees are appended to the ticket price at checkout.
 * - `absorb`: the club pays the fees; the buyer is charged the base price only and
 *   the fees are deducted from the club's settlement.
 */
export type FeeHandlingType = "pass_to_buyer" | "absorb"

export const DEFAULT_FEE_HANDLING_TYPE: FeeHandlingType = "pass_to_buyer"

export interface CheckoutChargeResult {
  /** Full fee breakdown for the base amount (always computed for record-keeping). */
  feeBreakdown: TransactionFeesBreakdown | null
  /** What the buyer is actually charged. */
  amountToCharge: number
  /** True when the club is covering the fees (buyer charged base only). */
  feesAbsorbed: boolean
}

/**
 * Resolves the amount a buyer is charged for a given net (post-discount) base
 * amount, honouring the event's fee-handling selection.
 */
export function resolveCheckoutCharge(
  netAmount: number,
  feeHandlingType: FeeHandlingType | undefined | null,
  platformFeePercent?: number
): CheckoutChargeResult {
  const feesAbsorbed = feeHandlingType === "absorb"
  const feeBreakdown =
    netAmount <= 0
      ? null
      : feesAbsorbed
        ? calculateAbsorbedTransactionFees(netAmount, platformFeePercent)
        : calculateTransactionFees(netAmount, platformFeePercent)
  const amountToCharge = feesAbsorbed
    ? netAmount
    : feeBreakdown
      ? feeBreakdown.finalAmount
      : netAmount
  return { feeBreakdown, amountToCharge, feesAbsorbed }
}

/**
 * Estimated net the club keeps per ticket when fees are absorbed:
 * gross − platform fee (incl. GST) − PG fee (incl. GST).
 */
export function estimateNetPerTicket(grossPrice: number, platformFeePercent?: number): number {
  const { totalFees, baseAmount } = calculateAbsorbedTransactionFees(grossPrice, platformFeePercent)
  return roundMoney(Math.max(0, baseAmount - totalFees))
}

/**
 * Membership plan pricing, all-inclusive of platform + PG fees + GST — the same number a member
 * is actually charged at Razorpay checkout, so browsing pages can show it up front instead of a
 * bare base price. `isUpgrade` mirrors the checkout flows' own logic: when the member has an
 * active plan cheaper than the target, only the price difference is charged/fee'd, not the full
 * plan price again.
 */
export function computeMembershipPlanCharge(params: {
  planPrice: number
  currentPlanPrice?: number
  isUpgradeEligible: boolean
  platformFeePercent?: number
}): { isUpgrade: boolean } & TransactionFeesBreakdown {
  const currentPlanPrice = params.currentPlanPrice ?? 0
  const isUpgrade = params.isUpgradeEligible && currentPlanPrice > 0 && params.planPrice > currentPlanPrice
  const baseAmount = isUpgrade ? Math.max(0, params.planPrice - currentPlanPrice) : Math.max(0, params.planPrice)
  return { isUpgrade, ...calculateTransactionFees(baseAmount, params.platformFeePercent) }
}

/** Razorpay's cut of whatever is charged, GST included: 2% × 1.18 = 2.36%. */
const PG_RATE_WITH_GST = (RAZORPAY_FEE_PERCENT / 100) * (1 + GST_PERCENT / 100)

/** Split a GST-inclusive PG amount back into fee + GST so the parts sum exactly. */
function splitPgFee(pgWithGst: number) {
  const razorpayFee = roundMoney(pgWithGst / (1 + GST_PERCENT / 100))
  return { razorpayFee, razorpayFeeGst: roundMoney(pgWithGst - razorpayFee) }
}

/**
 * Fees passed to the buyer (mirrors the backend transactionFeeService). Razorpay
 * takes 2.36% of the amount actually charged — fees included — so the total is
 * grossed up:  Total = (TicketPrice + PlatformFee + PlatformFee × 0.18) / (1 − 0.0236)
 * The platform fee stays a % of the ticket price.
 */
export function calculateTransactionFees(
  baseAmount: number,
  platformFeePercent?: number
): TransactionFeesBreakdown {
  const base = Math.max(0, baseAmount)
  const feePercent =
    platformFeePercent != null && Number.isFinite(platformFeePercent) ? platformFeePercent : PLATFORM_FEE_PERCENT

  // Round the GST-inclusive platform fee once (rounding fee then GST overcharges tiny amounts).
  const platform = calculateFeeWithGst(base, feePercent)
  const beforePg = base + platform.totalWithGst
  const finalAmount = roundMoney(beforePg / (1 - PG_RATE_WITH_GST))
  const pgWithGst = roundMoney(finalAmount - roundMoney(beforePg))
  const { razorpayFee, razorpayFeeGst } = splitPgFee(pgWithGst)

  return {
    baseAmount: roundMoney(base),
    platformFee: platform.fee,
    platformFeeGst: platform.gst,
    razorpayFee,
    razorpayFeeGst,
    totalFees: roundMoney(platform.totalWithGst + pgWithGst),
    finalAmount,
  }
}

/**
 * Fees when the club absorbs them: the buyer pays `chargedAmount` only, and
 * Razorpay's 2.36% + the platform fee come out of that same amount.
 */
export function calculateAbsorbedTransactionFees(
  chargedAmount: number,
  platformFeePercent?: number
): TransactionFeesBreakdown {
  const charged = Math.max(0, chargedAmount)
  const feePercent =
    platformFeePercent != null && Number.isFinite(platformFeePercent) ? platformFeePercent : PLATFORM_FEE_PERCENT
  const platform = calculateFeeWithGst(charged, feePercent)
  const razorpay = calculateFeeWithGst(charged, RAZORPAY_FEE_PERCENT)

  return {
    baseAmount: roundMoney(charged),
    platformFee: platform.fee,
    platformFeeGst: platform.gst,
    razorpayFee: razorpay.fee,
    razorpayFeeGst: razorpay.gst,
    totalFees: roundMoney(platform.totalWithGst + razorpay.totalWithGst),
    finalAmount: roundMoney(charged),
  }
}
