"use client"

import { HelpCircle, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { tierThresholdHours, tierThresholdValue, tierDisplayUnit } from "@/lib/refund-policy"

const REFUND_HELP_TEXT =
  "If disabled, members will not see the Cancel/Refund button in their app for this event."

// `hoursBefore` is the canonical threshold; `unit` is what the admin picked (so
// the member-facing copy shows the same unit). `daysBefore` kept for back-compat.
export type RefundTier = { hoursBefore: number; unit: 'days' | 'hours'; daysBefore?: number; refundPercentage: number }

function makeTier(value: number, unit: 'days' | 'hours', refundPercentage: number): RefundTier {
  const v = Math.max(0, Math.round(Number(value) || 0))
  const hoursBefore = unit === 'days' ? v * 24 : v
  return { hoursBefore, unit, daysBefore: Math.floor(hoursBefore / 24), refundPercentage }
}

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
  const hoursSet = new Set<number>()
  for (const t of tiers) {
    const h = tierThresholdHours(t)
    if (hoursSet.has(h)) return `Duplicate threshold (${tierThresholdValue(t)} ${tierDisplayUnit(t)}) — each window must be unique`
    hoursSet.add(h)
  }
  const sorted = [...tiers].sort((a, b) => tierThresholdHours(b) - tierThresholdHours(a))
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].refundPercentage > sorted[i - 1].refundPercentage) {
      return "Refund % must not increase as the window gets closer (e.g. 7 days: 75%, 3 days: 50%, 12 hours: 25%)"
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

  const [newTier, setNewTier] = useState<{ value: number; unit: 'days' | 'hours'; refundPercentage: number }>({
    value: 7,
    unit: 'days',
    refundPercentage: 100,
  })
  const [tierError, setTierError] = useState<string | null>(null)

  const handleToggle = (checked: boolean) => {
    if (toggleDisabled) return
    if (isCompleted && checked && !isRefundAllowed) return
    hapticSelection()
    onRefundAllowedChange(checked)
  }

  const addTier = () => {
    const next = [...refundTiers, makeTier(newTier.value, newTier.unit, newTier.refundPercentage)]
    const err = validateTiers(next)
    if (err) { setTierError(err); return }
    setTierError(null)
    onRefundTiersChange(next)
    setNewTier({ value: 0, unit: newTier.unit, refundPercentage: 100 })
  }

  const removeTier = (idx: number) => {
    const next = refundTiers.filter((_, i) => i !== idx)
    setTierError(null)
    onRefundTiersChange(next)
  }

  const sortedTiers = [...refundTiers].sort((a, b) => tierThresholdHours(b) - tierThresholdHours(a))

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
                <Label>Refund % tiers (before event)</Label>
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
                          <span className="font-medium">{tierThresholdValue(tier)}</span>
                          <span className="text-muted-foreground"> {tierDisplayUnit(tier)} before → </span>
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
                    <Label className="text-xs">Before event</Label>
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        value={newTier.value}
                        onChange={(e) => setNewTier((t) => ({ ...t, value: Number(e.target.value) || 0 }))}
                        className="flex-1"
                      />
                      <Select
                        value={newTier.unit}
                        onValueChange={(v) => setNewTier((t) => ({ ...t, unit: v as 'days' | 'hours' }))}
                      >
                        <SelectTrigger className="w-[88px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
