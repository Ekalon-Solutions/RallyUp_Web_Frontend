"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Mail, Phone, User } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { formatChargedMoney } from "@/lib/display-currency"
import { calculateTransactionFees } from "@/lib/transactionFees"

/** Shows the amount in the drive's own currency — the donor types and is charged in it, so no display conversion. */
const fmt = (n: number, currency: string) => formatChargedMoney(n, currency)

/** Half-to-even at the currency's precision — same as the backend's roundMajorAmount (utils/currency.ts). */
export function roundDonationAmount(n: number, currency: string): number {
  let exp = 2
  try { exp = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2 } catch {}
  const factor = 10 ** exp
  const scaled = n * factor
  const lower = Math.floor(scaled)
  const fraction = scaled - lower
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4
  const rounded = fraction < 0.5 - tolerance ? lower : fraction > 0.5 + tolerance ? lower + 1 : lower % 2 === 0 ? lower : lower + 1
  return rounded / factor
}

/** "User's choice" drives its quick-pick chips from the minimum (1x/5x/10x); fixed-amount drives use their saved presets. */
export const quickAmounts = (presets: number[], custom: boolean, min: number) =>
  custom ? [1, 5, 10].map((m) => Math.round(min * m * 100) / 100) : presets

/** Rounds to the currency's precision and validates — mirrors the backend normalizeDonationAmount. */
export function parseDonationAmount(raw: string, minAmount: number, currency = "INR"): { amount: number | null; error: string | null } {
  if (!raw.trim()) return { amount: null, error: null }
  // Plain decimal only — Number() would accept "0x10", "1e3", "Infinity".
  if (!/^(\d+\.?\d*|\.\d+)$/.test(raw.trim())) return { amount: null, error: "Enter a valid amount using digits only, e.g. 500 or 499.50" }
  const n = Number(raw.trim())
  if (!Number.isFinite(n) || n <= 0) return { amount: null, error: "Enter an amount greater than 0" }
  const amount = roundDonationAmount(n, currency)
  if (amount <= 0) return { amount: null, error: "Enter an amount greater than 0" }
  if (amount < minAmount) return { amount: null, error: `The minimum donation is ${fmt(minAmount, currency)}` }
  return { amount, error: null }
}

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if ((window as any).Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** White bordered section card used inside the "Make a Donation" dialog. */
export function DonationCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border bg-background p-4 sm:p-5">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  )
}

/** Input with a leading icon, as in the dialog's "Your Details" card. */
export function IconInput({ icon: Icon, ...props }: { icon: typeof User } & ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input className="h-11 rounded-xl bg-muted/60 pl-9" {...props} />
    </div>
  )
}

/** Dialog layout: scrolling body + sticky footer. */
export const dialogBody = "min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:px-6"
export const dialogFooter = "space-y-3 border-t bg-background px-4 py-4 sm:px-6"

export const PAYMENT_FAILED_MESSAGE = "We couldn't confirm this payment. If money left your account, it will be added to your donation or refunded automatically — please don't pay again yet."

/** After the checkout closes without a callback, ask the server (webhook may have confirmed it). */
async function waitForServerConfirmation(donationId: string, tries = 10): Promise<boolean> {
  // ~30s: UPI can capture well after Checkout says it failed; the status call asks Razorpay each time.
  for (let i = 0; i < tries; i++) {
    const res = await apiClient.getDonationStatus(donationId)
    if (res.data?.status === "paid") return true
    await new Promise((r) => setTimeout(r, 3000))
  }
  return false
}

export function DonateForm({ clubId, eventId, presetAmounts: savedPresets, minAmount: propMinAmount, allowCustom, primaryColor, title, currency: propCurrency = "INR", feeHandlingType: propFeeHandling, platformFeePercent: propFeePercent, onBusyChange }: {
  clubId: string
  eventId?: string
  presetAmounts: number[]
  minAmount: number
  allowCustom: boolean
  primaryColor?: string
  title: string
  currency?: string
  /** pass_to_buyer: fees are added to the donor's total. Server recomputes the real charge. */
  feeHandlingType?: "pass_to_buyer" | "absorb"
  platformFeePercent?: number
  /** True while an order / Razorpay Checkout is in flight, so a host dialog can stop trapping focus. */
  onBusyChange?: (busy: boolean) => void
}) {
  const { user } = useAuth()
  const isMember = (user as any)?.role === "member"
  const initialAmount = quickAmounts(savedPresets, allowCustom, propMinAmount)[0]
  const [selected, setSelected] = useState<number | null>(initialAmount ?? null)
  // With a custom amount allowed, the preset chips just fill the amount box.
  const [custom, setCustom] = useState(allowCustom && initialAmount ? String(initialAmount) : "")
  const [customError, setCustomError] = useState<string | null>(null)
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState<number | null>(null)
  // The server's config is what the order is charged with; event props are only a placeholder until it loads.
  const [config, setConfig] = useState<{ currency?: string; minAmount?: number; feeHandlingType?: "pass_to_buyer" | "absorb"; platformFeePercent?: number } | null>(null)

  useEffect(() => { onBusyChange?.(busy) }, [busy, onBusyChange])

  useEffect(() => {
    let live = true
    // ponytail: on failure fall back to the event props ({}), server still recomputes the charge.
    apiClient.getDonationConfig(clubId, eventId).then((res) => { if (live) setConfig(res.success && res.data ? res.data : {}) })
    return () => { live = false }
  }, [clubId, eventId])

  const currency = config?.currency || propCurrency
  const minAmount = config?.minAmount ?? propMinAmount
  const presetAmounts = quickAmounts(savedPresets, allowCustom, minAmount)
  const feeHandlingType = config?.feeHandlingType ?? propFeeHandling
  const platformFeePercent = config?.platformFeePercent ?? propFeePercent
  const money = (n: number) => fmt(n, currency)

  const customParsed = parseDonationAmount(custom, minAmount, currency)
  const amount = custom.trim() ? customParsed.amount : selected
  const fees = amount && feeHandlingType === "pass_to_buyer" ? calculateTransactionFees(amount, platformFeePercent) : null
  const total = fees?.finalAmount ?? amount

  const donate = async () => {
    setMessage(null)
    if (custom.trim() && customParsed.error) return setCustomError(customParsed.error)
    if (!amount) return setMessage("Choose or enter an amount")
    if (!isMember) {
      if (!donor.name.trim()) return setMessage("Please enter your name")
      if (!donor.email.trim() && !donor.phone.trim()) return setMessage("Please enter an email or phone number")
    }

    setBusy(true)
    const order = await apiClient.createDonationOrder({ clubId, eventId, amount, donor: isMember ? {} : donor })
    if (!order.success || !order.data) {
      setBusy(false)
      return setMessage(order.message || order.error || "Could not start the payment")
    }
    if (!(await loadRazorpay())) {
      setBusy(false)
      return setMessage("Could not load the payment window. Check your connection and try again.")
    }

    const { donationId, razorpayOrderId, keyId, amount: subunits, currency, clubName } = order.data
    let settled = false
    // Set by payment.failed; Razorpay keeps the modal open for a retry, so the outcome is only final on close.
    let failed = false
    const finish = (paid: boolean, failMessage?: string) => {
      if (settled) return
      settled = true
      setBusy(false)
      if (paid) {
        setMessage(null)
        setDone(amount)
      } else if (failMessage) setMessage(failMessage)
    }

    const rzp = new (window as any).Razorpay({
      key: keyId,
      order_id: razorpayOrderId,
      amount: subunits,
      currency,
      name: clubName,
      description: `Donation — ${title}`,
      prefill: isMember ? { name: (user as any)?.name, email: (user as any)?.email } : { name: donor.name, email: donor.email, contact: donor.phone },
      theme: primaryColor ? { color: primaryColor } : undefined,
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verified = await apiClient.verifyDonation(resp)
        if (verified.success) return finish(true)
        // Signature path failed (e.g. network) — the webhook may still confirm it.
        const paid = await waitForServerConfirmation(donationId)
        finish(paid, "We could not confirm your payment yet. If money was debited, it will be confirmed shortly — no need to pay again.")
      },
      modal: {
        ondismiss: async () => {
          // A plain close needs only a quick check; a failed attempt may still capture late.
          const paid = await waitForServerConfirmation(donationId, failed ? 10 : 2)
          finish(paid, failed ? PAYMENT_FAILED_MESSAGE : "Payment was not completed. You have not been charged.")
        },
      },
    })
    rzp.on("payment.failed", () => {
      failed = true
      setMessage(PAYMENT_FAILED_MESSAGE)
    })
    rzp.open()
  }

  if (done !== null) {
    return (
      <div className={cn(dialogBody, "py-8 text-center")} role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="text-lg font-bold">Thank you for donating {money(done)}!</p>
        <p className="text-sm text-muted-foreground">Your donation has been recorded. You can donate again any time.</p>
        <Button variant="outline" onClick={() => { setDone(null); setCustom("") }}>Donate again</Button>
      </div>
    )
  }

  const row = "flex justify-between gap-3"
  return (
    <>
      <div className={dialogBody}>
        <DonationCard title="Enter Amount">
          {presetAmounts.length > 0 && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Donation amount">
              {presetAmounts.map((n) => {
                const active = amount === n
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => { setSelected(n); setCustom(allowCustom ? String(n) : ""); setCustomError(null) }}
                    className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-colors", active ? "text-white" : "hover:bg-muted")}
                    style={active ? { backgroundColor: primaryColor ?? "#111", borderColor: primaryColor ?? "#111" } : undefined}
                  >
                    {money(n)}
                  </button>
                )
              })}
            </div>
          )}

          {allowCustom && (
            <div className="space-y-1.5">
              <Label htmlFor="customAmount" className="sr-only">Amount (min {money(minAmount)})</Label>
              <Input
                id="customAmount"
                inputMode="decimal"
                placeholder={String(minAmount)}
                value={custom}
                className="h-14 rounded-xl bg-muted/60 px-5 text-xl font-semibold md:text-xl"
                aria-invalid={Boolean(customError)}
                aria-describedby={customError ? "customAmountError" : "customAmountHint"}
                onChange={(e) => { setCustom(e.target.value); setCustomError(null) }}
                onBlur={() => {
                  if (!custom.trim()) return
                  const r = parseDonationAmount(custom, minAmount, currency)
                  if (r.amount !== null) setCustom(String(r.amount))
                  setCustomError(r.error)
                }}
              />
              {customError
                ? <p id="customAmountError" className="text-sm text-destructive">{customError}</p>
                : <p id="customAmountHint" className="text-xs text-muted-foreground">Minimum {money(minAmount)}</p>}
            </div>
          )}
        </DonationCard>

        {!isMember && (
          <DonationCard title="Your Details">
            <div className="grid gap-3 sm:grid-cols-2">
              <IconInput icon={User} aria-label="Full name" placeholder="Full name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })} />
              <IconInput icon={Phone} aria-label="Mobile number" type="tel" placeholder="Mobile number" value={donor.phone} onChange={(e) => setDonor({ ...donor, phone: e.target.value })} />
            </div>
            <IconInput icon={Mail} aria-label="Email" type="email" placeholder="Email (optional if mobile given)" value={donor.email} onChange={(e) => setDonor({ ...donor, email: e.target.value })} />
          </DonationCard>
        )}

        {amount ? (
          <DonationCard title="Donation Summary">
            <div className={cn(row, "text-sm")}><span>Donated amount</span><span>{money(amount)}</span></div>
            <div className="space-y-2.5 rounded-xl border bg-muted/50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Price breakdown</p>
              <div className={cn(row, "text-base")}><span>Donation amount</span><span>{money(amount)}</span></div>
              {fees && (
                <>
                  <div className={cn(row, "text-muted-foreground")}><span>Transaction fee</span><span>{money(fees.razorpayFee + fees.razorpayFeeGst)}</span></div>
                  <div className={cn(row, "text-muted-foreground")}><span>Platform fee</span><span>{money(fees.platformFee + fees.platformFeeGst)}</span></div>
                </>
              )}
              <div className={cn(row, "border-t pt-3 font-bold")}><span>Total Amount</span><span>{money(total ?? amount)}</span></div>
            </div>
            {!fees && <p className="text-xs text-muted-foreground">No extra fees — you pay exactly this amount.</p>}
          </DonationCard>
        ) : null}

        {isMember && (
          <p className="text-sm text-muted-foreground">Donating as <span className="font-medium text-foreground">{(user as any)?.name || (user as any)?.email}</span></p>
        )}
      </div>

      <div className={dialogFooter}>
        {message && <p className="text-sm text-destructive" role="alert">{message}</p>}
        {total ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-2xl font-bold">{money(total)}</span>
          </div>
        ) : null}
        <Button
          className="h-12 w-full rounded-xl text-base font-bold"
          style={primaryColor ? { backgroundColor: primaryColor, color: "white" } : undefined}
          onClick={donate}
          disabled={busy || !config}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {total ? `Donate ${money(total)}` : "Donate"}
        </Button>
      </div>
    </>
  )
}
