"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { apiClient, ClubPickupAddress } from "@/lib/api"
import { WEEKDAYS } from "@/lib/listings"
import { cn } from "@/lib/utils"
import { RepeatingRows, SectionCard, ToggleRow } from "./listing-form-sections"

export type MonetaryState = {
  amountMode: "preset" | "custom"
  presets: string[]
  minAmount: string
  waiverOn: boolean
  waiverCode: string
  waiver: { code: string; percentOff: number } | null
}

export type ItemsState = {
  items: { name: string; targetCount: string }[]
  atLocation: boolean
  locationAddress: string
  atNextEvent: boolean
  clubPickup: boolean
  pickupArrangedBy: "club" | "wingman"
  pickupAddressId: string
  slots: { day: number; enabled: boolean; time: string }[]
}

export const defaultSlots = () => WEEKDAYS.map((_, day) => ({ day, enabled: day !== 0, time: "" }))

function ChoiceCard({ selected, onSelect, title, hint, type = "radio", children }: {
  selected: boolean
  onSelect: () => void
  title: string
  hint: string
  type?: "radio" | "checkbox"
  children?: React.ReactNode
}) {
  return (
    <div className={cn("rounded-lg border p-4 transition-colors", selected ? "border-foreground bg-background" : "bg-muted/50")}>
      <button type="button" role={type} aria-checked={selected} onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        {type === "radio" ? (
          <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-foreground" : "border-muted-foreground")}>
            {selected && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
          </span>
        ) : (
          <Checkbox checked={selected} tabIndex={-1} className="mt-0.5 pointer-events-none" />
        )}
        <span>
          <span className="block font-medium">{title}</span>
          <span className="block text-sm text-muted-foreground">{hint}</span>
        </span>
      </button>
      {children}
    </div>
  )
}

export function MonetaryDetails({ state, onChange, currency, clubId }: {
  state: MonetaryState
  onChange: (patch: Partial<MonetaryState>) => void
  currency: string
  clubId: string
}) {
  const [checking, setChecking] = useState(false)

  const applyWaiver = async () => {
    setChecking(true)
    const res = await apiClient.validateFeeWaiver(state.waiverCode.trim(), clubId)
    setChecking(false)
    if (!res.success || !res.data) return void toast.error(res.message || "This waiver code is invalid or has expired")
    onChange({ waiver: res.data })
    toast.success(`Waiver applied: ${res.data.percentOff}% off the platform fee`)
  }

  return (
    <>
      <SectionCard title="Donation amount" description="Choose how donors decide how much to give.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard selected={state.amountMode === "preset"} onSelect={() => onChange({ amountMode: "preset" })} title="Choose amount" hint="You set the amounts donors can pick from" />
          <ChoiceCard selected={state.amountMode === "custom"} onSelect={() => onChange({ amountMode: "custom" })} title="User's choice" hint="Donors enter any amount they like" />
        </div>
        {state.amountMode === "preset" ? (
          <div className="space-y-2">
            <Label>Amounts *</Label>
            <RepeatingRows
              rows={state.presets}
              onChange={(presets) => onChange({ presets })}
              makeEmpty={() => ""}
              max={8}
              renderRow={(row, _u, i) => (
                <Input
                  aria-label={`Amount ${i + 1}`}
                  type="number"
                  min={1}
                  step="0.01"
                  value={row}
                  onChange={(e) => onChange({ presets: state.presets.map((p, j) => (j === i ? e.target.value : p)) })}
                />
              )}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="minAmount">Minimum amount ({currency}) *</Label>
            <Input id="minAmount" type="number" min={1} step="0.01" value={state.minAmount} onChange={(e) => onChange({ minAmount: e.target.value })} />
            <p className="text-xs text-muted-foreground">Donors can give any amount at or above this.</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Platform fee">
        <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          Fees are always absorbed by the club for donations. Donors pay exactly the amount they give.
        </p>
        <ToggleRow
          label="Apply for platform fee waiver"
          hint="Enter your waiver code to reduce the platform fee"
          checked={state.waiverOn || Boolean(state.waiver)}
          onChange={(waiverOn) => onChange({ waiverOn })}
        />
        {state.waiver ? (
          <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" /> {state.waiver.code} — {state.waiver.percentOff}% off the platform fee
          </p>
        ) : state.waiverOn && (
          <div className="flex gap-2">
            <Input aria-label="Waiver code" placeholder="WAIVER-CODE" value={state.waiverCode} onChange={(e) => onChange({ waiverCode: e.target.value.toUpperCase() })} />
            <Button type="button" variant="outline" onClick={applyWaiver} disabled={checking || !state.waiverCode.trim()}>
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}
      </SectionCard>
    </>
  )
}

export function ItemsDetails({ state, onChange, pickupAddresses }: {
  state: ItemsState
  onChange: (patch: Partial<ItemsState>) => void
  pickupAddresses: ClubPickupAddress[]
}) {
  return (
    <>
      <SectionCard title="Donation items" description="Add what donors can give. Leave the count empty for no limit.">
        <div className="hidden gap-2 pr-11 text-sm font-medium sm:flex">
          <span className="flex-1">Item name *</span>
          <span className="w-32 sm:w-40">Count <span className="font-normal text-muted-foreground">(optional)</span></span>
        </div>
        <RepeatingRows
          rows={state.items}
          onChange={(items) => onChange({ items })}
          makeEmpty={() => ({ name: "", targetCount: "" })}
          renderRow={(row, update, i) => (
            <>
              <Input aria-label={`Item ${i + 1} name`} placeholder="Item name" value={row.name} onChange={(e) => update({ name: e.target.value })} className="flex-1" />
              <Input aria-label={`Item ${i + 1} count`} type="number" min={1} step={1} placeholder="No limit" value={row.targetCount} onChange={(e) => update({ targetCount: e.target.value })} className="w-32 sm:w-40" />
            </>
          )}
        />
      </SectionCard>

      <SectionCard title="Pickup / drop address" description="Choose how donors get items to you. Pick one or more.">
        <ChoiceCard type="checkbox" selected={state.atLocation} onSelect={() => onChange({ atLocation: !state.atLocation })} title="Self Drop-off at Location" hint="Donors bring the items to your address">
          {state.atLocation && (
            <Input className="mt-3" aria-label="Drop-off address" placeholder="Drop-off address" value={state.locationAddress} onChange={(e) => onChange({ locationAddress: e.target.value })} />
          )}
        </ChoiceCard>
        <ChoiceCard type="checkbox" selected={state.atNextEvent} onSelect={() => onChange({ atNextEvent: !state.atNextEvent })} title="Self Drop-off at Next Event/Screening" hint="Donors hand over or send the items at the next event" />
        <ChoiceCard type="checkbox" selected={state.clubPickup} onSelect={() => onChange({ clubPickup: !state.clubPickup })} title="Arrange Club pickups" hint="The club collects the items from donors" />
        {state.clubPickup && (
          <div className="ml-4 space-y-3 border-l-2 pl-4 sm:ml-8">
            <ChoiceCard selected={state.pickupArrangedBy === "club"} onSelect={() => onChange({ pickupArrangedBy: "club" })} title="Club arranged pickup" hint="Your club handles the pickup" />
            <ChoiceCard selected={state.pickupArrangedBy === "wingman"} onSelect={() => onChange({ pickupArrangedBy: "wingman" })} title="Wingman arranged pickup" hint="Wingman handles the pickup from the address you choose" />
            {state.pickupArrangedBy === "wingman" && (
              <div className="space-y-2">
                <Label>Address *</Label>
                <Select value={state.pickupAddressId} onValueChange={(pickupAddressId) => onChange({ pickupAddressId })}>
                  <SelectTrigger><SelectValue placeholder={pickupAddresses.length ? "Select an address" : "No pickup addresses saved"} /></SelectTrigger>
                  <SelectContent>
                    {pickupAddresses.map((a) => (
                      <SelectItem key={a._id ?? a.pickupLocation} value={a._id ?? a.pickupLocation}>
                        {a.label} — {a.street}, {a.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pickupAddresses.length === 0 && (
                  <p className="text-xs text-muted-foreground">Add a pickup address under Merchandise → Logistics settings first.</p>
                )}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Delivery days and time" description="Turn on the days deliveries can be made and set a time for each.">
        <div className="divide-y">
          {state.slots.map((slot) => (
            <div key={slot.day} className="flex items-center gap-4 py-3">
              <span className="w-24 text-sm font-medium">{WEEKDAYS[slot.day]}</span>
              <Switch
                aria-label={`${WEEKDAYS[slot.day]} deliveries`}
                checked={slot.enabled}
                onCheckedChange={(enabled) => onChange({ slots: state.slots.map((s) => (s.day === slot.day ? { ...s, enabled } : s)) })}
              />
              <Input
                aria-label={`${WEEKDAYS[slot.day]} time`}
                type="time"
                className="w-40 sm:w-52"
                disabled={!slot.enabled}
                value={slot.time}
                onChange={(e) => onChange({ slots: state.slots.map((s) => (s.day === slot.day ? { ...s, time: e.target.value } : s)) })}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}
