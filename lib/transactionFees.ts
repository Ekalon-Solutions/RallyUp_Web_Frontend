export const PLATFORM_FEE_PERCENT = 5
export const RAZORPAY_FEE_PERCENT = 2
export const GST_PERCENT = 18

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
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
  const feeBreakdown = netAmount > 0 ? calculateTransactionFees(netAmount, platformFeePercent) : null
  const feesAbsorbed = feeHandlingType === "absorb"
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
  const { totalFees, baseAmount } = calculateTransactionFees(grossPrice, platformFeePercent)
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

export function calculateTransactionFees(
  baseAmount: number,
  platformFeePercent?: number
): TransactionFeesBreakdown {
  const base = Math.max(0, baseAmount)
  const feePercent = platformFeePercent ?? PLATFORM_FEE_PERCENT

  const platformFee = roundMoney((base * feePercent) / 100)
  const platformFeeGst = roundMoney((platformFee * GST_PERCENT) / 100)

  const razorpayFee = roundMoney((base * RAZORPAY_FEE_PERCENT) / 100)
  const razorpayFeeGst = roundMoney((razorpayFee * GST_PERCENT) / 100)

  const totalFees = roundMoney(platformFee + platformFeeGst + razorpayFee + razorpayFeeGst)
  const finalAmount = roundMoney(base + totalFees)

  return {
    baseAmount: roundMoney(base),
    platformFee,
    platformFeeGst,
    razorpayFee,
    razorpayFeeGst,
    totalFees,
    finalAmount,
  }
}
