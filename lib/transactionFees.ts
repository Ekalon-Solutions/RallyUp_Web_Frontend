export const PLATFORM_FEE_PERCENT = 4.5
export const RAZORPAY_FEE_PERCENT = 2.5
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
