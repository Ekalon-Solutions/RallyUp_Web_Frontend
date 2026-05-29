"use client"

import { HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NonRefundableBadge } from "@/components/member/non-refundable-badge"
import { cn } from "@/lib/utils"
import { hapticSelection } from "@/lib/haptic"

const REFUND_HELP_TEXT =
  "If disabled, members will not see the Cancel/Refund button in their app for this event."

type Props = {
  isRefundAllowed: boolean
  onRefundAllowedChange: (value: boolean) => void
  refundCutoffHours: string
  onRefundCutoffHoursChange: (value: string) => void
  isFreeEvent: boolean
  isCompleted?: boolean
  isEditMode?: boolean
  refundPolicyChangeReason?: string
  onRefundPolicyChangeReasonChange?: (value: string) => void
  cutoffInvalid?: boolean
  className?: string
}

export function EventRefundToggleSection({
  isRefundAllowed,
  onRefundAllowedChange,
  refundCutoffHours,
  onRefundCutoffHoursChange,
  isFreeEvent,
  isCompleted = false,
  isEditMode = false,
  refundPolicyChangeReason = "",
  onRefundPolicyChangeReasonChange,
  cutoffInvalid = false,
  className,
}: Props) {
  const cannotEnableRefunds = isCompleted && !isRefundAllowed
  const toggleDisabled = isFreeEvent || cannotEnableRefunds

  const handleToggle = (checked: boolean) => {
    if (toggleDisabled) return
    if (isCompleted && checked && !isRefundAllowed) return
    hapticSelection()
    onRefundAllowedChange(checked)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "rounded-lg border-2 p-4 space-y-4 transition-colors",
          isFreeEvent && "opacity-60 bg-muted/30 border-muted",
          cannotEnableRefunds && !isFreeEvent && "opacity-70",
          !isFreeEvent && isRefundAllowed && "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]",
          !isFreeEvent && !isRefundAllowed && "border-amber-500/50 bg-amber-500/5",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Label
                htmlFor="allow-member-refunds"
                className={cn(
                  "text-base font-semibold",
                  !isFreeEvent && isRefundAllowed && "text-[hsl(var(--success))]"
                )}
              >
                Allow Member Refunds
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    aria-label="Refund policy help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left">
                  {REFUND_HELP_TEXT}
                </TooltipContent>
              </Tooltip>
            </div>
            {isFreeEvent ? (
              <p className="text-sm text-muted-foreground">
                Refund settings are not applicable to free events. Zero-value tickets cannot be refunded.
              </p>
            ) : cannotEnableRefunds ? (
              <p className="text-sm text-muted-foreground">
                This event is completed. Refunds cannot be re-enabled for historical events.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Control whether members can cancel and request a refund for this event.
              </p>
            )}
          </div>
          <Switch
            id="allow-member-refunds"
            checked={isFreeEvent ? false : isRefundAllowed}
            disabled={toggleDisabled}
            onCheckedChange={handleToggle}
            className="shrink-0 data-[state=checked]:bg-[hsl(var(--success))] data-[state=unchecked]:bg-input"
            aria-describedby={isFreeEvent ? "refund-free-event-hint" : undefined}
          />
        </div>

        {!isFreeEvent && isRefundAllowed && (
          <div className="grid gap-2 pl-1 border-l-2 border-[hsl(var(--success)/0.4)] ml-1">
            <Label htmlFor="refundCutoffHours">Refund cut-off time (hours before match)</Label>
            <Input
              id="refundCutoffHours"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={refundCutoffHours}
              onChange={(e) => onRefundCutoffHoursChange(e.target.value)}
              className={cn(cutoffInvalid && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={cutoffInvalid}
            />
            <p className="text-xs text-muted-foreground">
              Members cannot request refunds within this window before kick-off (e.g. 48 hours).
            </p>
          </div>
        )}

        {!isFreeEvent && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-border/60">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member preview
            </span>
            <div className="flex items-center gap-2">
              {!isRefundAllowed ? (
                <NonRefundableBadge />
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  No badge — refund option shown in member app
                </span>
              )}
            </div>
          </div>
        )}

        {isEditMode && !isFreeEvent && onRefundPolicyChangeReasonChange && (
          <div className="grid gap-2">
            <Label htmlFor="refundPolicyChangeReason">Reason for refund policy change</Label>
            <Textarea
              id="refundPolicyChangeReason"
              placeholder="Required when toggling refund allowed on or off"
              value={refundPolicyChangeReason}
              onChange={(e) => onRefundPolicyChangeReasonChange(e.target.value)}
              rows={2}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
