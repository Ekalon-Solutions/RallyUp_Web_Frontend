/**
 * Transaction fee calculation per PPSA:
 * - Platform (Wingman) fee: 4.5% of transaction value + GST
 * - Payment gateway (Razorpay) fee: 2.5% of transaction value + GST
 * - GST applied on both fees (default 18% for India)
 */

export const PLATFORM_FEE_PERCENT = 4.5
export const RAZORPAY_FEE_PERCENT = 2.5
export const GST_PERCENT = 18

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export interface TransactionFeesBreakdown {
  /** Base amount (e.g. ticket total or order subtotal after coupon) */
  baseAmount: number
  /** Platform fee (4.5% of base) */
  platformFee: number
  /** GST on platform fee */
  platformFeeGst: number
  /** Razorpay gateway fee (2.5% of base) */
  razorpayFee: number
  /** GST on Razorpay fee */
  razorpayFeeGst: number
  /** Sum of all fees + GST */
  totalFees: number
  /** Amount to charge: baseAmount + totalFees */
  finalAmount: number
}

/**
 * Calculates platform fee, Razorpay fee, and GST on both.
 * Final amount = baseAmount + (4.5% + GST) + (2.5% + GST).
 */
export function calculateTransactionFees(baseAmount: number): TransactionFeesBreakdown {
  const base = Math.max(0, baseAmount)

  const platformFee = roundMoney((base * PLATFORM_FEE_PERCENT) / 100)
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
