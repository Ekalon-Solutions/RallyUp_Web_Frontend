"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventFeeManagementSection } from "@/components/admin/event-fee-management-section"
import { EventRefundToggleSection, RefundTier } from "@/components/admin/event-refund-toggle-section"
import type { FeeHandlingType } from "@/lib/transactionFees"
import { RepeatingRows, SectionCard } from "./listing-form-sections"

export type AddOnDraft = { name: string; price: string }

export type ActivityPricingState = {
  maxAttendees: string
  fee: string
  mode: "online" | "offline"
  onlineUrl: string
  location: string
  inclusions: string[]
  addOns: AddOnDraft[]
  feeHandlingType: FeeHandlingType
  isRefundAllowed: boolean
  refundCutoffHours: string
  refundTiers: RefundTier[]
}

/** Category decides which pricing fields show — the "dynamic form" for Contests & Activities. */
export function activityFieldsFor(category: string) {
  const isTrip = category === "offsite-trips"
  return { isTrip, showAddOns: category !== "contests", showInclusions: isTrip }
}

export function ActivityPricingStep({
  category,
  currency,
  state,
  onChange,
  canManageFees,
  feeLocked,
  clubId,
  isEdit,
}: {
  category: string
  currency: string
  state: ActivityPricingState
  onChange: (patch: Partial<ActivityPricingState>) => void
  canManageFees: boolean
  feeLocked: boolean
  clubId: string
  isEdit: boolean
}) {
  const { isTrip, showAddOns, showInclusions } = activityFieldsFor(category)

  const feeInput = (
    <div className="space-y-2">
      <Label htmlFor="fee">{isTrip ? "Offsite/Trip cost" : "Fee per participant"} *</Label>
      <Input id="fee" type="number" min={0} step="0.01" value={state.fee} onChange={(e) => onChange({ fee: e.target.value })} />
    </div>
  )
  const capacityInput = (
    <div className="space-y-2">
      <Label htmlFor="maxAttendees">{isTrip ? "Seats available" : "Max participants"}</Label>
      <Input id="maxAttendees" type="number" min={1} step={1} placeholder="Leave blank for unlimited" value={state.maxAttendees} onChange={(e) => onChange({ maxAttendees: e.target.value })} />
    </div>
  )

  return (
    <>
      <SectionCard title="Pricing & logistics">
        {isTrip ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="Enter trip location" value={state.location} onChange={(e) => onChange({ location: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {feeInput}
              {capacityInput}
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {capacityInput}
              {feeInput}
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={state.mode} onValueChange={(v) => onChange({ mode: v as "online" | "offline" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state.mode === "online" ? (
              <div className="space-y-2">
                <Label htmlFor="onlineUrl">Web-link/URL *</Label>
                <Input id="onlineUrl" type="url" placeholder="https://" value={state.onlineUrl} onChange={(e) => onChange({ onlineUrl: e.target.value })} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="location">Venue *</Label>
                <Input id="location" placeholder="Enter venue / address" value={state.location} onChange={(e) => onChange({ location: e.target.value })} />
              </div>
            )}
          </>
        )}
      </SectionCard>

      {showInclusions && (
        <SectionCard title="Inclusions" description="List everything the travel cost covers.">
          <RepeatingRows
            rows={state.inclusions}
            onChange={(inclusions) => onChange({ inclusions })}
            makeEmpty={() => ""}
            addLabel="Add more"
            renderRow={(row, _u, i) => (
              <Input
                aria-label={`Inclusion ${i + 1}`}
                placeholder="e.g. Return bus transfer"
                value={row}
                onChange={(e) => onChange({ inclusions: state.inclusions.map((r, j) => (j === i ? e.target.value : r)) })}
              />
            )}
          />
        </SectionCard>
      )}

      {showAddOns && (
        <SectionCard title="Add-ons" description={`Optional extras members can buy on top of the ${isTrip ? "trip" : "fee"}.`}>
          <RepeatingRows
            rows={state.addOns}
            onChange={(addOns) => onChange({ addOns })}
            makeEmpty={() => ({ name: "", price: "" })}
            addLabel={isTrip ? "Add more" : "Add"}
            renderRow={(row, update, i) => (
              <>
                <Input aria-label={`Add-on ${i + 1} name`} placeholder="Item name" value={row.name} onChange={(e) => update({ name: e.target.value })} className="flex-1" />
                <Input aria-label={`Add-on ${i + 1} price`} type="number" min={0} step="0.01" placeholder={`${currency} Price`} value={row.price} onChange={(e) => update({ price: e.target.value })} className="w-32 sm:w-40" />
              </>
            )}
          />
        </SectionCard>
      )}

      {(
        <EventFeeManagementSection
          value={state.feeHandlingType}
          onChange={(feeHandlingType) => onChange({ feeHandlingType })}
          ticketPrice={Number(state.fee) || 0}
          currency={currency}
          canManage={canManageFees}
          locked={feeLocked}
          clubId={clubId}
          className="bg-card"
        />
      )}

      {(
        <EventRefundToggleSection
          isRefundAllowed={state.isRefundAllowed}
          onRefundAllowedChange={(isRefundAllowed) => onChange({ isRefundAllowed })}
          refundCutoffHours={state.refundCutoffHours}
          onRefundCutoffHoursChange={(refundCutoffHours) => onChange({ refundCutoffHours })}
          refundTiers={state.refundTiers}
          onRefundTiersChange={(refundTiers) => onChange({ refundTiers })}
          isFreeEvent={false}
          isCompleted={false}
          isEditMode={isEdit}
          refundPolicyChangeReason=""
          onRefundPolicyChangeReasonChange={() => {}}
          cutoffInvalid={state.isRefundAllowed && !/^\d+$/.test(state.refundCutoffHours.trim())}
        />
      )}
    </>
  )
}
