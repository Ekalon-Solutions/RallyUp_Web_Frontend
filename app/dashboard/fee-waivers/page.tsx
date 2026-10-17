"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient, PlatformFeeWaiver } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
import { SectionCard } from "@/components/listings/listing-form-sections"

/** System owner: issue codes that cut the platform fee on CSR / donation drives. */
function FeeWaivers() {
  const [waivers, setWaivers] = useState<PlatformFeeWaiver[]>([])
  const [form, setForm] = useState({ code: "", percentOff: "100", maxUses: "", expiresAt: "" })
  const [saving, setSaving] = useState(false)

  const load = () => apiClient.getFeeWaivers().then((res) => setWaivers(res.data ?? []))
  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    const percentOff = Number(form.percentOff)
    if (!/^[A-Z0-9_-]{3,}$/.test(form.code)) return void toast.error("Code: 3+ letters, numbers, - or _")
    if (!(percentOff >= 1 && percentOff <= 100)) return void toast.error("Discount must be between 1 and 100%")
    setSaving(true)
    const res = await apiClient.createFeeWaiver({
      code: form.code,
      percentOff,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : undefined,
    })
    setSaving(false)
    if (!res.success) return void toast.error(res.message || "Failed to create code")
    toast.success(`Code ${form.code} created`)
    setForm({ code: "", percentOff: "100", maxUses: "", expiresAt: "" })
    load()
  }

  const toggle = async (w: PlatformFeeWaiver, isActive: boolean) => {
    const res = await apiClient.setFeeWaiverActive(w._id, isActive)
    if (!res.success) return void toast.error(res.message || "Failed to update")
    load()
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Fee Waiver Codes</h1>
        <p className="text-sm text-muted-foreground">Clubs apply these on CSR and donation drives to reduce the platform fee.</p>
      </div>

      <SectionCard title="New code">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" placeholder="CSR-2026" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentOff">Platform fee off (%)</Label>
            <Input id="percentOff" type="number" min={1} max={100} value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUses">Max drives <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="maxUses" type="number" min={1} placeholder="Unlimited" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="expiresAt" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <Button type="submit" disabled={saving} className="sm:col-span-4 sm:w-fit">Create code</Button>
        </form>
      </SectionCard>

      <SectionCard title="Codes">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waivers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No codes yet</TableCell></TableRow>
              )}
              {waivers.map((w) => (
                <TableRow key={w._id}>
                  <TableCell className="font-mono font-medium">
                    {w.code} {w.clubId && <Badge variant="outline" className="ml-1">{w.clubId.name}</Badge>}
                  </TableCell>
                  <TableCell>{w.percentOff}% off</TableCell>
                  <TableCell>{w.uses}{w.maxUses ? ` / ${w.maxUses}` : ""}</TableCell>
                  <TableCell>{w.expiresAt ? formatDisplayDate(w.expiresAt) : "Never"}</TableCell>
                  <TableCell className="text-right">
                    <Switch checked={w.isActive} onCheckedChange={(v) => toggle(w, v)} aria-label={`Toggle ${w.code}`} />
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

export default function FeeWaiversPage() {
  return (
    <ProtectedRoute requireSystemOwner>
      <DashboardLayout>
        <FeeWaivers />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
