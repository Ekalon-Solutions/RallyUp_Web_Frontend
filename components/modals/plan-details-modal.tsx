"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CalendarDays } from "lucide-react"
import { PlanBenefits, PlanBrochure } from "@/components/membership-plan/plan-benefits"
import type { PublicPlanConfig } from "@/lib/membershipPlanConfig"

export type DetailedPlan = PublicPlanConfig & {
  _id: string
  name: string
  description?: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR" }).format(price)
  } catch {
    return `${currency} ${price}`
  }
}

/** "Sep, 2026" — matches the admin plan preview card. */
function formatMonthYear(value: string): string {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ""
  return `${date.toLocaleDateString(undefined, { month: "short" })}, ${date.getFullYear()}`
}

function formatValidity(plan: DetailedPlan): string {
  if (plan.planStartDate && plan.planEndDate) {
    return `${formatMonthYear(plan.planStartDate)} - ${formatMonthYear(plan.planEndDate)}`
  }
  const months = plan.duration ?? 0
  if (months === 0) return "Lifetime"
  if (months === 12) return "1 Year"
  return `${months} Month${months > 1 ? "s" : ""}`
}

/**
 * "Know More About The Plan" — the public breakdown of what a plan includes,
 * built entirely from what the admin configured in the plan wizard.
 */
export function PlanDetailsModal({
  open,
  onOpenChange,
  plan,
  displayPrice,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: DetailedPlan | null
  /** All-inclusive charge, when the caller has already computed fees/upgrades. */
  displayPrice?: number
}) {
  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="text-2xl font-bold">{plan.name}</DialogTitle>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </DialogHeader>

        <Separator />

        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(displayPrice ?? plan.price, plan.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Validity</p>
            <p className="flex items-center gap-2 text-base font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {formatValidity(plan)}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-1 font-bold text-foreground">Membership Benefits</h3>
          <PlanBenefits plan={plan} />
        </div>

        <PlanBrochure plan={plan} />
      </DialogContent>
    </Dialog>
  )
}
