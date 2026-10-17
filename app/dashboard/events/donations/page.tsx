"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient, DonationRecord, Event } from "@/lib/api"
import { WEEKDAYS } from "@/lib/listings"
import { formatDisplayDate } from "@/lib/utils"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { WizardHeader } from "@/components/listings/listing-wizard-chrome"
import { SectionCard, ToggleRow } from "@/components/listings/listing-form-sections"
import { money } from "@/components/listings/listing-preview"

const HANDOVER: Record<string, string> = { location: "Drop-off", next_event: "At next event", pickup: "Pickup" }

function GeneralDonationSettings({ clubId }: { clubId: string }) {
  const [enabled, setEnabled] = useState(false)
  const [minAmount, setMinAmount] = useState("1")
  const [presets, setPresets] = useState("100, 500, 1000")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.getClubById(clubId).then((res) => {
      const d = res.data?.donationSettings
      if (!d) return
      setEnabled(d.enabled)
      setMinAmount(String(d.minAmount))
      setPresets(d.presetAmounts.join(", "))
    })
  }, [clubId])

  const saveSettings = async () => {
    const presetAmounts = presets.split(",").map((p) => Number(p.trim())).filter((n) => n > 0)
    if (!(Number(minAmount) >= 1)) return void toast.error("Minimum amount must be at least 1")
    setSaving(true)
    const res = await apiClient.updateClubDonationSettings(clubId, { enabled, minAmount: Number(minAmount), presetAmounts })
    setSaving(false)
    if (!res.success) return void toast.error(res.message || "Failed to save")
    toast.success(enabled ? "Donations are open on your club page" : "Club donations turned off")
  }

  return (
    <SectionCard title="Always-on club donations" description="A Donate button on your club page that members and guests can use any time, separate from donation drives. Fees are absorbed by the club.">
      <ToggleRow label="Accept donations at any time" checked={enabled} onChange={setEnabled} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minAmount">Minimum amount (INR)</Label>
          <Input id="minAmount" type="number" min={1} step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="presets">Suggested amounts</Label>
          <Input id="presets" placeholder="100, 500, 1000" value={presets} onChange={(e) => setPresets(e.target.value)} />
        </div>
      </div>
      <Button onClick={saveSettings} disabled={saving}>Save</Button>
    </SectionCard>
  )
}

function DonationsContent() {
  const clubId = useRequiredClubId()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get("eventId") ?? "all")
  const [drives, setDrives] = useState<Event[]>([])
  const [data, setData] = useState<{ donations: DonationRecord[]; totalRaised: number; count: number } | null>(null)

  useEffect(() => {
    if (!clubId) return
    apiClient.getEventsByClub(clubId).then((res) => setDrives((res.data ?? []).filter((e) => e.listingType === "donation")))
  }, [clubId])

  useEffect(() => {
    if (!clubId) return
    setData(null)
    apiClient.getClubDonations(clubId, filter === "all" ? undefined : filter).then((res) => {
      if (!res.success) toast.error(res.message || "Failed to load donations")
      setData(res.data ?? { donations: [], totalRaised: 0, count: 0 })
    })
  }, [clubId, filter])

  if (!clubId) return null

  return (
    <div className="w-full max-w-6xl space-y-6">
      <WizardHeader title="Donations" backHref="/dashboard/events?tab=listings" />
      <GeneralDonationSettings clubId={clubId} />

      <SectionCard
        title="Received donations & pledges"
        description={data ? `${data.count} entries · ${money(data.totalRaised)} raised` : "Loading…"}
        action={
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v)
              router.replace(v === "all" ? "/dashboard/events/donations" : `/dashboard/events/donations?eventId=${v}`)
            }}
          >
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All donations</SelectItem>
              <SelectItem value="general">Club donations (no drive)</SelectItem>
              {drives.map((d) => <SelectItem key={d._id} value={d._id}>{d.title}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Gift</TableHead>
                <TableHead>Hand-over</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.donations.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No donations yet</TableCell></TableRow>
              )}
              {data?.donations.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="whitespace-nowrap">{formatDisplayDate(d.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{d.donor.name} {d.isGuest && <Badge variant="outline" className="ml-1 text-[10px]">Guest</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{[d.donor.email, d.donor.phone].filter(Boolean).join(" · ")}</p>
                  </TableCell>
                  <TableCell>{d.eventId?.title ?? "Club donation"}</TableCell>
                  <TableCell>
                    {d.kind === "monetary"
                      ? <span className="font-medium">{money(d.amount ?? 0, d.currency)}</span>
                      : d.items?.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.dropOffMethod ? HANDOVER[d.dropOffMethod] : "—"}
                    {d.pickupAddress && <p className="text-xs text-muted-foreground">{d.pickupAddress}</p>}
                    {d.preferredSlot && <p className="text-xs text-muted-foreground">{WEEKDAYS[d.preferredSlot.day]} {d.preferredSlot.time}</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  )
}

export default function DonationsAdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <Suspense fallback={null}>
          <DonationsContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
