"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, DonationDetails } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { WEEKDAYS } from "@/lib/listings"

type Method = "location" | "next_event" | "pickup"

/** Item (CSR) drive: donors pledge quantities and how they will hand the items over. */
export function PledgeForm({ clubId, eventId, donation, primaryColor }: {
  clubId: string
  eventId: string
  donation: DonationDetails
  primaryColor?: string
}) {
  const { user } = useAuth()
  const isMember = (user as any)?.role === "member"
  const dropOff = donation.dropOff
  const methods = ([
    dropOff?.atLocation && { value: "location", label: "I'll drop off at the club's location", hint: dropOff.locationAddress },
    dropOff?.atNextEvent && { value: "next_event", label: "I'll hand over at the next event/screening" },
    dropOff?.clubPickup && { value: "pickup", label: "Please pick up from me" },
  ].filter(Boolean) as { value: Method; label: string; hint?: string }[])
  const slots = (donation.deliverySlots ?? []).filter((s) => s.enabled)

  const [qty, setQty] = useState<Record<string, string>>({})
  const [method, setMethod] = useState<Method | "">(methods.length === 1 ? methods[0].value : "")
  const [pickupAddress, setPickupAddress] = useState("")
  const [day, setDay] = useState("")
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setMessage(null)
    const items = Object.entries(qty)
      .map(([name, q]) => ({ name, quantity: Number(q) }))
      .filter((i) => i.quantity > 0)
    if (items.length === 0) return setMessage("Enter a quantity for at least one item")
    if (items.some((i) => !Number.isInteger(i.quantity))) return setMessage("Quantities must be whole numbers")
    if (!method) return setMessage("Choose how you will hand over the items")
    if (method === "pickup" && !pickupAddress.trim()) return setMessage("Enter the pickup address")
    if (!isMember && !donor.name.trim()) return setMessage("Please enter your name")
    if (!isMember && !donor.email.trim() && !donor.phone.trim()) return setMessage("Please enter an email or phone number")

    setBusy(true)
    const res = await apiClient.createItemPledge({
      clubId,
      eventId,
      items,
      dropOffMethod: method,
      pickupAddress: method === "pickup" ? pickupAddress.trim() : undefined,
      preferredSlot: day ? { day: Number(day) } : undefined,
      donor: isMember ? {} : donor,
    })
    setBusy(false)
    if (!res.success) return setMessage(res.message || res.error || "Could not save your pledge")
    setDone(true)
  }

  if (done) {
    return (
      <div className="space-y-2 py-4 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="text-lg font-bold">Thank you for your pledge!</p>
        <p className="text-sm text-muted-foreground">The club will be in touch about the hand-over.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>What would you like to give?</Label>
        {(donation.items ?? []).map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <span className="text-sm">
              {item.name}
              {item.targetCount ? <span className="text-muted-foreground"> · needed: {item.targetCount}</span> : null}
            </span>
            <Input
              aria-label={`${item.name} quantity`}
              type="number"
              min={0}
              step={1}
              placeholder="0"
              className="w-24"
              value={qty[item.name] ?? ""}
              onChange={(e) => setQty({ ...qty, [item.name]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Hand-over">
        <Label>Hand-over</Label>
        {methods.map((m) => (
          <label key={m.value} className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="radio" name="handover" className="mt-1" checked={method === m.value} onChange={() => setMethod(m.value)} />
            <span>
              {m.label}
              {m.hint && <span className="block text-xs text-muted-foreground">{m.hint}</span>}
            </span>
          </label>
        ))}
      </div>

      {method === "pickup" && (
        <Textarea aria-label="Pickup address" placeholder="Pickup address" rows={2} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
      )}

      {slots.length > 0 && method !== "next_event" && (
        <div className="space-y-1.5">
          <Label>Preferred day</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger><SelectValue placeholder="Any day" /></SelectTrigger>
            <SelectContent>
              {slots.map((s) => (
                <SelectItem key={s.day} value={String(s.day)}>{WEEKDAYS[s.day]}{s.time ? ` · ${s.time}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!isMember && (
        <div className="space-y-2">
          <Input aria-label="Your name" placeholder="Your name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })} />
          <Input aria-label="Email" type="email" placeholder="Email" value={donor.email} onChange={(e) => setDonor({ ...donor, email: e.target.value })} />
          <Input aria-label="Phone" type="tel" placeholder="Phone" value={donor.phone} onChange={(e) => setDonor({ ...donor, phone: e.target.value })} />
        </div>
      )}

      {message && <p className="text-sm text-destructive" role="alert">{message}</p>}

      <Button className="h-12 w-full rounded-xl text-base font-bold" style={primaryColor ? { backgroundColor: primaryColor, color: "white" } : undefined} onClick={submit} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pledge items
      </Button>
    </div>
  )
}
