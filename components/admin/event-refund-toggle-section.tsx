"use client"

import { HelpCircle, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NonRefundableBadge } from "@/components/member/non-refundable-badge"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { hapticSelection } from "@/lib/haptic"

const REFUND_HELP_TEXT =
  "If disabled, members will not see the Cancel/Refund button in their app for this event."

export type RefundTier = { daysBefore: number; refundPercentage: number }

type Props = {
  isRefundAllowed: boolean
  onRefundAllowedChange: (value: boolean) => void
  refundCutoffHours: string
  onRefundCutoffHoursChange: (value: string) => void
  refundTiers: RefundTier[]
  onRefundTiersChange: (tiers: RefundTier[]) => void
  isFreeEvent: boolean
  isCompleted?: boolean
  isEditMode?: boolean
  refundPolicyChangeReason?: string
  onRefundPolicyChangeReasonChange?: (value: string) => void
  cutoffInvalid?: boolean
  className?: string
}

function validateTiers(tiers: RefundTier[]): string | null {
  const daysSet = new Set<number>()
  for (const t of tiers) {
    if (daysSet.has(t.daysBefore)) return `Duplicate "days before" value (${t.daysBefore}) — each window must be unique`
    daysSet.add(t.daysBefore)
  }
  const sorted = [...tiers].sort((a, b) => b.daysBefore - a.daysBefore)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].refundPercentage > sorted[i - 1].refundPercentage) {
      return "Refund % must not increase as days decrease (e.g. 7 days: 75%, 3 days: 50%, 0 days: 25%)"
    }
  }
  return null
}

export function EventRefundToggleSection({
  isRefundAllowed,
  onRefundAllowedChange,
  refundCutoffHours,
  onRefundCutoffHoursChange,
  refundTiers,
  onRefundTiersChange,
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

  const [newTier, setNewTier] = useState<RefundTier>({ daysBefore: 7, refundPercentage: 100 })
  const [tierError, setTierError] = useState<string | null>(null)

  const handleToggle = (checked: boolean) => {
    if (toggleDisabled) return
    if (isCompleted && checked && !isRefundAllowed) return
    hapticSelection()
    onRefundAllowedChange(checked)
  }

  const addTier = () => {
    const next = [...refundTiers, newTier]
    const err = validateTiers(next)
    if (err) { setTierError(err); return }
    setTierError(null)
    onRefundTiersChange(next)
    setNewTier({ daysBefore: 0, refundPercentage: 100 })
  }

  const removeTier = (idx: number) => {
    const next = refundTiers.filter((_, i) => i !== idx)
    setTierError(null)
    onRefundTiersChange(next)
  }

  const sortedTiers = [...refundTiers].sort((a, b) => b.daysBefore - a.daysBefore)

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
          <div className="space-y-4 pl-1 border-l-2 border-[hsl(var(--success)/0.4)] ml-1">
            <div className="grid gap-2">
              <Label htmlFor="refundCutoffHours">Refund cut-off time (hours before event)</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Refund % tiers (days before event)</Label>
                <span className="text-xs text-muted-foreground">Max 5 tiers</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Set how much members get back depending on when they cancel. Leave empty to refund 100% (minus platform fees) up to the cut-off.
              </p>

              {sortedTiers.length > 0 && (
                <div className="space-y-1.5">
                  {sortedTiers.map((tier, i) => {
                    const origIdx = refundTiers.indexOf(tier)
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
                      >
                        <span className="text-sm flex-1">
                          <span className="font-medium">{tier.daysBefore}</span>
                          <span className="text-muted-foreground"> days before → </span>
                          <span className="font-medium">{tier.refundPercentage}%</span>
                          <span className="text-muted-foreground"> refund</span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTier(origIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {refundTiers.length < 5 && (
                <div className="flex gap-2 items-end pt-1">
                  <div className="grid gap-1 flex-1">
                    <Label className="text-xs">Days before</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newTier.daysBefore}
                      onChange={(e) => setNewTier((t) => ({ ...t, daysBefore: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="grid gap-1 flex-1">
                    <Label className="text-xs">Refund %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newTier.refundPercentage}
                      onChange={(e) => setNewTier((t) => ({ ...t, refundPercentage: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addTier} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              )}

              {tierError && (
                <p className="text-xs text-destructive">{tierError}</p>
              )}
            </div>
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
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                  Refundable
                </Badge>
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
