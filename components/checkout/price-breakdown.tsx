"use client"

import { cn } from "@/lib/utils"
import type { FeeHandlingType } from "@/lib/transactionFees"

export type PriceBreakdownProps = {
  /** Ticket subtotal the fees are computed on (post-discount, post-points net). */
  baseAmount: number
  /** Payment-gateway fee incl. GST. Ignored when fees are absorbed. */
  pgFeeTotal: number
  /** Platform fee incl. GST. Ignored when fees are absorbed. */
  platformFeeTotal: number
  /** Final payable amount — must equal the amount sent to the payment gateway. */
  total: number
  /** Admin's per-event choice. `absorb` hides the internal fee lines from the member. */
  feeHandlingType?: FeeHandlingType | null
  /** Currency-aware formatter supplied by the host so symbols stay consistent. */
  formatCurrency: (amount: number) => string
  ticketLabel?: string
  className?: string
}

/**
 * Invoice-style member-facing price breakdown for event checkout.
 *
 * - Pass-to-buyer: shows Ticket Price, Transaction Fee (PG), Platform Fee, Total.
 * - Absorb: shows Ticket Price and Total only — internal fee logic is hidden.
 *
 * Secondary text uses the global `--muted-foreground` CSS variable (via the
 * `text-muted-foreground` utility) so fees read as supporting, not dominant.
 * Every row is screen-reader labelled, and a client-side check verifies the
 * visible line items sum to `total` (the gateway-requested amount).
 */
export function PriceBreakdown({
  baseAmount,
  pgFeeTotal,
  platformFeeTotal,
  total,
  feeHandlingType,
  formatCurrency,
  ticketLabel = "Ticket Price",
  className,
}: PriceBreakdownProps) {
  const feesAbsorbed = feeHandlingType === "absorb"

  // Sum of the line items the member can see, compared against the payable the
  // gateway is charged (both rounded the same way the order amount is rounded).
  const visibleSum = feesAbsorbed
    ? baseAmount
    : baseAmount + pgFeeTotal + platformFeeTotal
  const sumMatches = Math.abs(Math.round(visibleSum) - Math.round(total)) <= 1

  if (process.env.NODE_ENV !== "production" && !sumMatches) {
    // eslint-disable-next-line no-console
    console.warn("[PriceBreakdown] line items do not sum to payable amount", {
      baseAmount,
      pgFeeTotal,
      platformFeeTotal,
      visibleSum,
      total,
      feeHandlingType,
    })
  }

  const row = (label: string, value: number, muted: boolean) => (
    <div
      className={cn(
        "flex items-center justify-between",
        muted ? "text-xs text-muted-foreground" : "text-sm"
      )}
      role="row"
      aria-label={`${label}: ${formatCurrency(value)}`}
    >
      <span role="cell">{label}</span>
      <span role="cell">{formatCurrency(value)}</span>
    </div>
  )

  return (
    <div
      role="table"
      aria-label="Price breakdown"
      className={cn(
        "rounded-lg border border-border bg-muted/20 p-3 space-y-2",
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Price breakdown
      </p>

      {row(ticketLabel, baseAmount, false)}

      {!feesAbsorbed && (
        <>
          {row("Transaction Fee (PG)", pgFeeTotal, true)}
          {row("Platform Fee", platformFeeTotal, true)}
        </>
      )}

      <div
        className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold"
        role="row"
        aria-label={`Total Amount: ${formatCurrency(total)}`}
      >
        <span role="cell">Total Amount</span>
        <span role="cell" className="text-primary">{formatCurrency(total)}</span>
      </div>

      {!sumMatches && (
        <p role="alert" className="text-xs text-destructive">
          Amount looks out of date — please refresh before paying.
        </p>
      )}
    </div>
  )
}
