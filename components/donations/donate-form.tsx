"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { money } from "@/components/listings/listing-preview"
import { calculateTransactionFees } from "@/lib/transactionFees"

/** Rounds to 2 decimals (INR precision) and validates — mirrors the backend rule. */
export function parseDonationAmount(raw: string, minAmount: number): { amount: number | null; error: string | null } {
  if (!raw.trim()) return { amount: null, error: null }
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return { amount: null, error: "Enter an amount greater than 0" }
  const amount = Math.round(n * 100) / 100
  if (amount <= 0) return { amount: null, error: "Enter an amount greater than 0" }
  if (amount < minAmount) return { amount: null, error: `The minimum donation is ${money(minAmount)}` }
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

/** After the checkout closes without a callback, ask the server (webhook may have confirmed it). */
async function waitForServerConfirmation(donationId: string): Promise<boolean> {
  for (let i = 0; i < 4; i++) {
    const res = await apiClient.getDonationStatus(donationId)
    if (res.data?.status === "paid") return true
    await new Promise((r) => setTimeout(r, 2000))
  }
  return false
}

export function DonateForm({ clubId, eventId, presetAmounts, minAmount, allowCustom, primaryColor, title, feeHandlingType = "absorb", platformFeePercent }: {
  clubId: string
  eventId?: string
  presetAmounts: number[]
  minAmount: number
  allowCustom: boolean
  primaryColor?: string
  title: string
  /** pass_to_buyer: fees are added to the donor's total. Server recomputes the real charge. */
  feeHandlingType?: "pass_to_buyer" | "absorb"
  platformFeePercent?: number
}) {
  const { user } = useAuth()
  const isMember = (user as any)?.role === "member"
  const [selected, setSelected] = useState<number | null>(presetAmounts[0] ?? null)
  const [custom, setCustom] = useState("")
  const [customError, setCustomError] = useState<string | null>(null)
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState<number | null>(null)

  const customParsed = parseDonationAmount(custom, minAmount)
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
    const finish = (paid: boolean, failMessage?: string) => {
      if (settled) return
      settled = true
      setBusy(false)
      if (paid) setDone(amount)
      else if (failMessage) setMessage(failMessage)
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
          const paid = await waitForServerConfirmation(donationId)
          finish(paid, "Payment was not completed. You have not been charged.")
        },
      },
    })
    rzp.on("payment.failed", () => setMessage("The payment failed. You can try again."))
    rzp.open()
  }

  if (done !== null) {
    return (
      <div className="space-y-2 py-4 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="text-lg font-bold">Thank you for donating {money(done)}!</p>
        <p className="text-sm text-muted-foreground">Your donation has been recorded. You can donate again any time.</p>
        <Button variant="outline" onClick={() => { setDone(null); setCustom("") }}>Donate again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {presetAmounts.length > 0 && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Donation amount">
          {presetAmounts.map((n) => {
            const active = !custom.trim() && selected === n
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { setSelected(n); setCustom(""); setCustomError(null) }}
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
          <Label htmlFor="customAmount">{presetAmounts.length ? "Or enter an amount" : "Amount"} (min {money(minAmount)})</Label>
          <Input
            id="customAmount"
            inputMode="decimal"
            placeholder={String(minAmount)}
            value={custom}
            aria-invalid={Boolean(customError)}
            aria-describedby={customError ? "customAmountError" : undefined}
            onChange={(e) => { setCustom(e.target.value); setCustomError(null) }}
            onBlur={() => {
              if (!custom.trim()) return
              const r = parseDonationAmount(custom, minAmount)
              if (r.amount !== null) setCustom(String(r.amount))
              setCustomError(r.error)
            }}
          />
          {customError && <p id="customAmountError" className="text-sm text-destructive">{customError}</p>}
        </div>
      )}

      {isMember ? (
        <p className="text-sm text-muted-foreground">Donating as <span className="font-medium text-foreground">{(user as any)?.name || (user as any)?.email}</span></p>
      ) : (
        <div className="space-y-2">
          <Input aria-label="Your name" placeholder="Your name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })} />
          <Input aria-label="Email" type="email" placeholder="Email" value={donor.email} onChange={(e) => setDonor({ ...donor, email: e.target.value })} />
          <Input aria-label="Phone" type="tel" placeholder="Phone (optional if email given)" value={donor.phone} onChange={(e) => setDonor({ ...donor, phone: e.target.value })} />
        </div>
      )}

      {fees && amount && (
        <div className="space-y-1 rounded-lg bg-muted/60 p-3 text-sm">
          <div className="flex justify-between"><span>Donation</span><span>{money(amount)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Transaction fee</span><span>{money(fees.razorpayFee + fees.razorpayFeeGst)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Platform fee</span><span>{money(fees.platformFee + fees.platformFeeGst)}</span></div>
          <div className="flex justify-between border-t pt-1 font-semibold"><span>You pay</span><span>{money(fees.finalAmount)}</span></div>
        </div>
      )}

      {message && <p className="text-sm text-destructive" role="alert">{message}</p>}

      <Button
        className="h-12 w-full rounded-xl text-base font-bold"
        style={primaryColor ? { backgroundColor: primaryColor, color: "white" } : undefined}
        onClick={donate}
        disabled={busy}
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {total ? `Donate ${money(total)}` : "Donate"}
      </Button>
      {!fees && <p className="text-center text-xs text-muted-foreground">No extra fees — you pay exactly this amount.</p>}
    </div>
  )
}
