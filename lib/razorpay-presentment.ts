"use client"

import { toast } from "sonner"
import { getDisplayCurrencySession } from "@/lib/display-currency"

export const FX_CONVERSION_FAILED = "FX_CONVERSION_FAILED"

export type RazorpayCreateOrderResult = {
  razorpayOrderId: string
  amount: number
  currency: string
  chargeAmount?: number
  chargeCurrency?: string
  fallbackToInr?: boolean
  notice?: string | null
  code?: string
  retryable?: boolean
  error?: string
}

export class RazorpayPresentmentError extends Error {
  code?: string
  retryable: boolean
  notice: string
  constructor(message: string, opts?: { code?: string; retryable?: boolean }) {
    super(message)
    this.name = "RazorpayPresentmentError"
    this.code = opts?.code
    this.retryable = Boolean(opts?.retryable)
    this.notice = message
  }
}

export function presentmentRequestFields() {
  const session = getDisplayCurrencySession()
  return {
    presentmentCurrency: session.chargeCurrency || session.currency,
  }
}

/** International collection is cards-only per Razorpay. */
export function razorpayCheckoutMethods(currency?: string) {
  const inr = (currency || "INR").toUpperCase() === "INR"
  return {
    netbanking: inr,
    card: true,
    wallet: inr,
    upi: inr,
    paylater: inr,
    cardless_emi: inr,
    emi: inr,
    bank_transfer: inr,
  }
}

export function razorpayPrefill(user?: {
  name?: string
  email?: string
  phoneNumber?: string
  countryCode?: string
} | null) {
  if (!user) return undefined
  const contact = [user.countryCode, user.phoneNumber].filter(Boolean).join("")
  return {
    name: user.name || undefined,
    email: user.email || undefined,
    contact: contact || undefined,
  }
}

export async function createRazorpayPresentmentOrder(
  body: Record<string, unknown>,
  headers: Record<string, string> = { "Content-Type": "application/json" }
): Promise<RazorpayCreateOrderResult> {
  const response = await fetch("/api/razorpay/create-order", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...presentmentRequestFields(), ...body }),
  })
  const data = (await response.json().catch(() => null)) as RazorpayCreateOrderResult | null
  if (!response.ok) {
    const notice =
      data?.notice ||
      data?.error ||
      "Failed to create payment order"
    throw new RazorpayPresentmentError(notice, {
      code: data?.code,
      retryable: data?.retryable || data?.code === FX_CONVERSION_FAILED,
    })
  }
  if (!data?.razorpayOrderId) {
    throw new RazorpayPresentmentError("Failed to create payment order")
  }
  if (data.fallbackToInr && data.notice) {
    toast.message(data.notice)
  }
  return data
}

export function presentmentFailureMessage(err: unknown): { message: string; retryable: boolean } {
  if (err instanceof RazorpayPresentmentError) {
    return { message: err.notice, retryable: err.retryable }
  }
  if (err instanceof Error) return { message: err.message, retryable: false }
  return { message: "Payment could not be started. Please try again.", retryable: false }
}
