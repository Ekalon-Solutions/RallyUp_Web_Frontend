"use client"

import { HelpCircle, Lock, Wallet, Users } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { hapticSelection } from "@/lib/haptic"
import { useEffect, useState } from "react"
import {
  PLATFORM_FEE_PERCENT,
  RAZORPAY_FEE_PERCENT,
  GST_PERCENT,
  calculateTransactionFees,
  estimateNetPerTicket,
  type FeeHandlingType,
} from "@/lib/transactionFees"
import { apiClient } from "@/lib/api"

type Props = {
  value: FeeHandlingType
  onChange: (value: FeeHandlingType) => void
  /** Representative gross ticket price used for the live revenue preview. */
  ticketPrice: number
  currency: string
  /** Whether the current admin is allowed to modify the selection. */
  canManage: boolean
  /** Disable + explain when the selection is locked (e.g. tickets already sold). */
  locked?: boolean
  className?: string
  platformFeePercent?: number
  /** Club ID to fetch the per-club platform fee from the features API. */
  clubId?: string
}

const OPTIONS: {
  value: FeeHandlingType
  title: string
  caption: string
  icon: typeof Wallet
}[] = [
  {
    value: "absorb",
    title: "Absorb Fees (Club Pays)",
    caption: "Member pays the ticket price; your club covers PG + Platform fees.",
    icon: Wallet,
  },
  {
    value: "pass_to_buyer",
    title: "Pass Fees to Buyer (Member Pays)",
    caption: "PG % + Platform fee are added on top of the ticket price at checkout.",
    icon: Users,
  },
]

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "CA$", JPY: "¥",
    BRL: "R$", MXN: "$", ZAR: "R",
  }
  const symbol = symbols[currency] || `${currency} `
  return `${symbol}${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function EventFeeManagementSection({
  value,
  onChange,
  ticketPrice,
  currency,
  canManage,
  locked = false,
  className,
  platformFeePercent: platformFeePercentProp,
  clubId,
}: Props) {
  const [fetchedFee, setFetchedFee] = useState<number | null>(null)
  const [isLoadingFee, setIsLoadingFee] = useState(false)
  
  // Use prop if provided, otherwise use fetched value, finally fall back to default
  const platformFeePercent = platformFeePercentProp !== undefined 
    ? platformFeePercentProp 
    : (fetchedFee !== null ? fetchedFee : PLATFORM_FEE_PERCENT)

  useEffect(() => {
    if (platformFeePercentProp !== undefined) {
      return
    }
    if (!clubId) {
      return
    }
    
    setIsLoadingFee(true)
    apiClient.getMyClubFeatures(clubId)
      .then((res) => {
        if (res.success && res.data) {
          const actualData = (res.data as any).data || res.data
          const fee = actualData.platformFeePercent
          setFetchedFee(fee !== undefined ? fee : PLATFORM_FEE_PERCENT)
        } else {
          setFetchedFee(PLATFORM_FEE_PERCENT)
        }
      })
      .catch((err) => {
        setFetchedFee(PLATFORM_FEE_PERCENT)
      })
      .finally(() => {
        setIsLoadingFee(false)
      })
  }, [clubId, platformFeePercentProp])

  const disabled = !canManage || locked
  const gross = Math.max(0, ticketPrice)
  const fees = gross > 0 ? calculateTransactionFees(gross, platformFeePercent) : null
  const platformTotal = fees ? fees.platformFee + fees.platformFeeGst : 0
  const pgTotal = fees ? fees.razorpayFee + fees.razorpayFeeGst : 0

  // Net the club keeps per ticket under the current selection.
  const netPerTicket =
    value === "absorb" ? estimateNetPerTicket(gross, platformFeePercent) : gross
  // What the buyer pays per ticket under the current selection.
  const buyerPays = value === "absorb" ? gross : fees ? fees.finalAmount : gross

  const handleSelect = (next: FeeHandlingType) => {
    if (disabled || next === value) return
    hapticSelection()
    onChange(next)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "rounded-lg border-2 p-4 space-y-4 transition-colors border-border",
          disabled && "opacity-80",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-base font-semibold">Fee Management *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    aria-label="Fee rates help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left space-y-1">
                  <p className="font-medium">Current rates for your club tier</p>
                  <p>Platform fee: {platformFeePercent.toFixed(1)}% + {GST_PERCENT}% GST</p>
                  <p>Payment gateway: {RAZORPAY_FEE_PERCENT}% + {GST_PERCENT}% GST</p>
                  <p className="text-muted-foreground">
                    Fees apply to the ticket price after discounts.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose who pays the Payment Gateway + Platform fees for this paid event.
            </p>
          </div>
        </div>

        {!canManage && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Only a Primary Owner or Financial Admin can change fee handling. The
              current selection is shown for reference.
            </span>
          </div>
        )}

        {canManage && locked && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Fee handling is locked because at least one ticket has been sold.</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Fee management">
          {OPTIONS.map((opt) => {
            const selected = value === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "text-left rounded-lg border-2 p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]"
                    : "border-border hover:border-muted-foreground/40",
                  disabled && "cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      selected ? "text-[hsl(var(--success))]" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium">{opt.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{opt.caption}</p>
              </button>
            )
          })}
        </div>

        {/* Real-time Revenue Preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Revenue preview (per ticket)
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross ticket price</span>
            <span>{formatCurrency(gross, currency)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Platform fee ({platformFeePercent.toFixed(1)}% + GST)</span>
            <span>+{formatCurrency(platformTotal, currency)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Payment gateway fee ({RAZORPAY_FEE_PERCENT}% + GST)</span>
            <span>+{formatCurrency(pgTotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
            <span>Estimated net per ticket</span>
            <span className={cn(value === "absorb" && "text-[hsl(var(--success))]")}>
              {formatCurrency(netPerTicket, currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Buyer pays</span>
            <span>{formatCurrency(buyerPays, currency)}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
