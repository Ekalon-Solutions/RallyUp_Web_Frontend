import { apiClient } from './api'

export type RecoveredRazorpayPayment = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpayDismissOutcome =
  | { outcome: 'paid'; payment: RecoveredRazorpayPayment }
  | { outcome: 'cancelled' }
  | { outcome: 'unconfirmed' }

const HANDOFF_GRACE_MS = 3000
const POLL_INTERVAL_MS = 2000
const EMPTY_STATUS_ATTEMPTS = 2
const POST_IN_FLIGHT_EMPTY_ATTEMPTS = 3
const MAX_POLL_ATTEMPTS = 30

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForPossibleRedirectReturn(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()

  return new Promise((resolve) => {
    if (document.visibilityState !== 'visible') {
      const onBack = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onBack)
          resolve()
        }
      }
      document.addEventListener('visibilitychange', onBack)
      return
    }

    const onHide = () => {
      if (document.visibilityState !== 'visible') {
        document.removeEventListener('visibilitychange', onHide)
        clearTimeout(timer)
        const onBack = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', onBack)
            resolve()
          }
        }
        document.addEventListener('visibilitychange', onBack)
      }
    }
    document.addEventListener('visibilitychange', onHide)
    const timer = setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide)
      resolve()
    }, HANDOFF_GRACE_MS)
  })
}

/**
 * Razorpay's modal ondismiss fires for a real close *and* when VPA, netbanking,
 * wallets, or pay-later leave the checkout window. Confirm with Razorpay
 * before treating that as a user cancel.
 */
export function waitForRazorpayRedirectReturn(): Promise<void> {
  return waitForPossibleRedirectReturn()
}

export async function resolveRazorpayDismiss(orderId?: string): Promise<RazorpayDismissOutcome> {
  await waitForPossibleRedirectReturn()
  if (!orderId) return { outcome: 'cancelled' }

  let sawInFlight = false
  let consecutiveEmpty = 0
  let lastError = false

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    if (attempt > 1) await delay(POLL_INTERVAL_MS)

    try {
      const res = await apiClient.checkRazorpayOrder(orderId)
      lastError = false
      const body = res.data

      const payment = {
        razorpay_payment_id: body.razorpay_payment_id || '',
        razorpay_order_id: body.razorpay_order_id || orderId,
        razorpay_signature: body.razorpay_signature || '',
      }
      if (
        body?.success &&
        payment.razorpay_payment_id.startsWith('pay_') &&
        payment.razorpay_signature.length >= 32
      ) {
        return { outcome: 'paid', payment }
      }

      const status = body?.status
      const paymentStatus = body?.paymentStatus
      const inFlight =
        paymentStatus === 'created' ||
        paymentStatus === 'authorized' ||
        status === 'attempted' ||
        status === 'paid'

      if (inFlight && paymentStatus !== 'failed') {
        sawInFlight = true
        consecutiveEmpty = 0
        continue
      }

      consecutiveEmpty += 1
      const emptyLimit = sawInFlight ? POST_IN_FLIGHT_EMPTY_ATTEMPTS : EMPTY_STATUS_ATTEMPTS
      if (consecutiveEmpty >= emptyLimit) {
        return { outcome: 'cancelled' }
      }
    } catch {
      lastError = true
    }
  }

  if (lastError || sawInFlight) return { outcome: 'unconfirmed' }
  return { outcome: 'cancelled' }
}
