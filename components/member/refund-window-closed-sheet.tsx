"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { EventRefundPolicyData } from "@/lib/refund-policy"
import { formatHoursRemaining } from "@/lib/refund-policy"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: EventRefundPolicyData | null
}

export function RefundWindowClosedSheet({ open, onOpenChange, policy }: Props) {
  if (!policy) return null

  const topRule = policy.rules?.[0]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Refund window closed</SheetTitle>
          <SheetDescription>
            {policy.clubName}&apos;s cut-off policy for &quot;{policy.eventTitle}&quot;
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground pb-6">
          <p>
            Refunds were available until the club&apos;s published cut-off time. That window has
            now passed, so self-service cancellation is no longer available.
          </p>
          {policy.cancelCutoffAt && (
            <p>
              <strong className="text-foreground">Cut-off:</strong>{" "}
              {new Date(policy.cancelCutoffAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          {topRule && (
            <p>
              <strong className="text-foreground">Club rule:</strong>{" "}
              {topRule.daysBefore} day{topRule.daysBefore === 1 ? "" : "s"} before the event — up to{" "}
              {topRule.refundPercentage}% refund.
            </p>
          )}
          {policy.hoursRemainingToCancel === 0 && (
            <p className="text-amber-800 dark:text-amber-200">
              {formatHoursRemaining(0)}
            </p>
          )}
          <p className="text-xs border-t pt-3">{policy.policyText}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
