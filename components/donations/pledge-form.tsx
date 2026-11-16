"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, MapPin, Phone, Plus, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, DonationDetails } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { WEEKDAYS } from "@/lib/listings"
import { cn } from "@/lib/utils"
import { DonationCard, IconInput, dialogBody, dialogFooter } from "@/components/donations/donate-form"

type Method = "location" | "next_event" | "pickup"

const ROMAN: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
/** 1 → "I", 4 → "IV" — item lists are numbered this way in the mockups. */
export function toRoman(n: number): string {
  let out = ""
  for (const [v, r] of ROMAN) while (n >= v) { out += r; n -= v }
  return out
}

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
    dropOff?.atLocation && { value: "location", label: "Self Drop-off at Location" },
    dropOff?.atNextEvent && { value: "next_event", label: "Self Drop-off at Next Event / Screening" },
    dropOff?.clubPickup && { value: "pickup", label: "Arrange Club Pickup" },
  ].filter(Boolean) as { value: Method; label: string }[])
  const slots = (donation.deliverySlots ?? []).filter((s) => s.enabled)
  const catalog = donation.items ?? []

  const [rows, setRows] = useState<{ name: string; qty: string }[]>(catalog[0] ? [{ name: catalog[0].name, qty: "" }] : [])
  const [method, setMethod] = useState<Method | "">(methods.length === 1 ? methods[0].value : "")
  const [pickupAddress, setPickupAddress] = useState("")
  const [day, setDay] = useState("")
  // Prefilled from the profile; whatever is sent overrides it on the pledge (backend resolveDonor).
  const [donor, setDonor] = useState({
    name: isMember ? (user as any)?.name ?? "" : "",
    phone: isMember ? [(user as any)?.countryCode, (user as any)?.phoneNumber].filter(Boolean).join("") : "",
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const used = new Set(rows.map((r) => r.name))
  const nextUnused = catalog.find((i) => !used.has(i.name))
  const setRow = (i: number, patch: Partial<{ name: string; qty: string }>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const pledged = rows.map((r) => ({ name: r.name, quantity: Number(r.qty) })).filter((i) => i.quantity > 0)
  const totalItems = pledged.reduce((n, i) => n + (Number.isInteger(i.quantity) ? i.quantity : 0), 0)

  const submit = async () => {
    setMessage(null)
    if (pledged.length === 0) return setMessage("Enter a quantity for at least one item")
    if (pledged.some((i) => !Number.isInteger(i.quantity))) return setMessage("Quantities must be whole numbers")
    if (!method) return setMessage("Choose how you will hand over the items")
    if (method === "pickup" && !pickupAddress.trim()) return setMessage("Enter the pickup address")
    if (!isMember && !donor.name.trim()) return setMessage("Please enter your name")
    if (!isMember && !donor.phone.trim()) return setMessage("Please enter your mobile number")

    setBusy(true)
    const res = await apiClient.createItemPledge({
      clubId,
      eventId,
      items: pledged,
      dropOffMethod: method,
      pickupAddress: method === "pickup" ? pickupAddress.trim() : undefined,
      preferredSlot: day ? { day: Number(day) } : undefined,
      donor: { name: donor.name.trim() || undefined, phone: donor.phone.trim() || undefined },
    })
    setBusy(false)
    if (!res.success) return setMessage(res.message || res.error || "Could not save your pledge")
    setDone(true)
  }

  if (done) {
    return (
      <div className={cn(dialogBody, "py-8 text-center")} role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="text-lg font-bold">Thank you for your pledge!</p>
        <p className="text-sm text-muted-foreground">The club will be in touch about the hand-over.</p>
      </div>
    )
  }

  const field = "h-11 rounded-xl bg-muted/60"
  return (
    <>
      <div className={dialogBody}>
        <DonationCard title="Your Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <IconInput icon={User} aria-label="Full name" placeholder="Full name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })} />
            <IconInput icon={Phone} aria-label="Mobile number" type="tel" placeholder="Mobile number" value={donor.phone} onChange={(e) => setDonor({ ...donor, phone: e.target.value })} />
          </div>
        </DonationCard>

        <DonationCard title="Choose Donation Items">
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <Select value={r.name} onValueChange={(name) => setRow(i, { name })}>
                  <SelectTrigger aria-label={`Item ${i + 1}`} className={cn(field, "min-w-0 flex-1")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {catalog.filter((c) => c.name === r.name || !used.has(c.name)).map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}{c.targetCount ? <span className="text-muted-foreground"> · needed: {c.targetCount}</span> : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  aria-label={`${r.name} quantity`}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Qty"
                  className={cn(field, "w-20 sm:w-28")}
                  value={r.qty}
                  onChange={(e) => setRow(i, { qty: e.target.value })}
                />
                {rows.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground" aria-label={`Remove ${r.name}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : <span className="w-10 shrink-0" aria-hidden />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <span className="font-semibold">Add more items</span>
            <Button type="button" variant="outline" className="rounded-xl" disabled={!nextUnused} onClick={() => nextUnused && setRows([...rows, { name: nextUnused.name, qty: "" }])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </div>
        </DonationCard>

        {pledged.length > 0 && (
          <DonationCard title="Donation Summary">
            <div className="overflow-hidden rounded-xl border text-sm">
              <table className="w-full">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-14 px-4 py-2.5 text-left font-medium">No.</th>
                    <th className="px-4 py-2.5 text-left font-medium">Item</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {pledged.map((p, i) => (
                    <tr key={p.name} className="border-t">
                      <td className="px-4 py-3 text-muted-foreground">{toRoman(i + 1)}</td>
                      <td className="px-4 py-3 font-semibold">{p.name}</td>
                      <td className="px-4 py-3 text-right font-semibold">× {p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/60 font-bold">
                  <tr>
                    <td className="px-4 py-3" colSpan={2}>Total items</td>
                    <td className="px-4 py-3 text-right">{totalItems}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </DonationCard>
        )}

        <DonationCard title="Choose Donation Drop Method">
          <div className="space-y-3" role="radiogroup" aria-label="Donation drop method">
            {methods.map((m) => {
              const active = method === m.value
              return (
                <div key={m.value} className={cn("rounded-xl border bg-muted/50 transition-colors", active && "border-foreground/30")}>
                  <button type="button" role="radio" aria-checked={active} onClick={() => setMethod(m.value)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-medium">
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", active ? "border-foreground" : "border-muted-foreground/60")}>
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                    </span>
                    {m.label}
                  </button>
                  {active && m.value === "location" && dropOff?.locationAddress && (
                    <div className="mx-4 mb-4 ml-12 flex items-start gap-2 rounded-lg border bg-background px-3 py-2.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="whitespace-pre-wrap">{dropOff.locationAddress}</span>
                    </div>
                  )}
                  {active && m.value === "pickup" && (
                    <div className="mx-4 mb-4 ml-12">
                      <Input aria-label="Pickup address" placeholder="Enter pickup address" className="h-11 rounded-lg bg-background" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {slots.length > 0 && method && method !== "next_event" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preferred day</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preferred day">
                {[{ value: "", label: "Any day" }, ...slots.map((s) => ({ value: String(s.day), label: `${WEEKDAYS[s.day]}${s.time ? ` · ${s.time}` : ""}` }))].map((c) => {
                  const active = day === c.value
                  return (
                    <button
                      key={c.value || "any"}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setDay(c.value)}
                      className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", active ? "border-foreground bg-foreground text-background" : "hover:bg-muted")}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </DonationCard>
      </div>

      <div className={dialogFooter}>
        {message && <p className="text-sm text-destructive" role="alert">{message}</p>}
        <Button className="h-12 w-full rounded-xl text-base font-bold" style={primaryColor ? { backgroundColor: primaryColor, color: "white" } : undefined} onClick={submit} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </div>
    </>
  )
}
