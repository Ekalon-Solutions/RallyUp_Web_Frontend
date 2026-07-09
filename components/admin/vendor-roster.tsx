"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CountryCodeSelect } from "@/components/country-code-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Mail, Phone, Pencil, ScanLine, UserPlus, UserX } from "lucide-react"
import { toast } from "sonner"

type Vendor = {
  _id: string
  name: string
  email: string
  phoneNumber?: string
  countryCode?: string
  isActive?: boolean
}

type VendorRosterProps = {
  /** Called after any vendor mutation so siblings (e.g. the assignment panel) can refresh. */
  onChanged?: () => void
}

const EMPTY_FORM = { name: "", email: "", countryCode: "+1", phoneNumber: "" }

export function VendorRoster({ onChanged }: VendorRosterProps) {
  const [clubId, setClubId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [editForm, setEditForm] = useState({ name: "", countryCode: "+1", phoneNumber: "" })
  const [savingEdit, setSavingEdit] = useState(false)

  const [deactivateTarget, setDeactivateTarget] = useState<Vendor | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const load = useCallback(async (activeClubId: string) => {
    setLoading(true)
    try {
      const res = await apiClient.listClubVendors(activeClubId)
      if (res.success && res.data) setVendors(res.data as Vendor[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("activeClubId") : null
    setClubId(id)
    if (id) void load(id)
    else setLoading(false)
  }, [load])

  const refresh = async () => {
    if (clubId) await load(clubId)
    onChanged?.()
  }

  const handleCreate = async () => {
    if (!clubId) return
    const name = createForm.name.trim()
    const email = createForm.email.trim()
    const phoneNumber = createForm.phoneNumber.trim()
    const countryCode = createForm.countryCode.trim()
    if (!name || !email || !phoneNumber || !countryCode) {
      toast.error("Name, email, country code, and phone number are all required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address")
      return
    }
    setCreating(true)
    try {
      const res = await apiClient.createVendor(clubId, { name, email, phoneNumber, countryCode })
      if (res.success) {
        toast.success(`Vendor ${name} created`)
        setCreateOpen(false)
        setCreateForm(EMPTY_FORM)
        await refresh()
      } else {
        toast.error(res.error || res.message || "Failed to create vendor")
      }
    } catch {
      toast.error("Failed to create vendor")
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (vendor: Vendor) => {
    setEditVendor(vendor)
    setEditForm({
      name: vendor.name || "",
      countryCode: vendor.countryCode || "+1",
      phoneNumber: vendor.phoneNumber || "",
    })
  }

  const handleSaveEdit = async () => {
    if (!clubId || !editVendor) return
    const name = editForm.name.trim()
    const phoneNumber = editForm.phoneNumber.trim()
    const countryCode = editForm.countryCode.trim()
    if (!name || !phoneNumber || !countryCode) {
      toast.error("Name, country code, and phone number are required")
      return
    }
    setSavingEdit(true)
    try {
      const res = await apiClient.updateVendor(clubId, editVendor._id, {
        name,
        phoneNumber,
        countryCode,
      })
      if (res.success) {
        toast.success("Vendor updated")
        setEditVendor(null)
        await refresh()
      } else {
        toast.error(res.error || res.message || "Failed to update vendor")
      }
    } catch {
      toast.error("Failed to update vendor")
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeactivate = async () => {
    if (!clubId || !deactivateTarget) return
    setDeactivating(true)
    try {
      const res = await apiClient.updateVendor(clubId, deactivateTarget._id, { isActive: false })
      if (res.success) {
        toast.success(`${deactivateTarget.name} deactivated`)
        setDeactivateTarget(null)
        await refresh()
      } else {
        toast.error(res.error || res.message || "Failed to deactivate vendor")
      }
    } catch {
      toast.error("Failed to deactivate vendor")
    } finally {
      setDeactivating(false)
    }
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Vendors
            </CardTitle>
            <CardDescription>
              Scan-only match-day crew for this club. Add new vendors by name, email, and phone —
              edit their details or deactivate access at any time.
            </CardDescription>
          </div>
          <Button type="button" className="shrink-0" onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New vendor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm font-medium">No vendors yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use “New vendor” to add scan-only crew, or elevate a member to the Vendor role.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div
                key={vendor._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials(vendor.name || "V")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{vendor.name}</p>
                      <Badge
                        className={
                          vendor.isActive === false
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }
                      >
                        {vendor.isActive === false ? "Inactive" : "Active"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {vendor.email}
                      </span>
                      {vendor.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {vendor.countryCode || ""}
                          {vendor.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(vendor)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={() => setDeactivateTarget(vendor)}
                  >
                    <UserX className="mr-1.5 h-3.5 w-3.5" />
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create vendor */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a vendor</DialogTitle>
            <DialogDescription>
              Add a scan-only match-day vendor directly by name, email, and phone — they don&apos;t
              need an existing membership. They&apos;ll sign in with this email or phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="cv-name">Full name</Label>
              <Input
                id="cv-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Jordan Vendor"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cv-email">Email</Label>
              <Input
                id="cv-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <div className="flex gap-2">
                <CountryCodeSelect
                  value={createForm.countryCode}
                  onValueChange={(value) => setCreateForm((p) => ({ ...p, countryCode: value }))}
                  className="w-24 shrink-0"
                />
                <Input
                  aria-label="Phone number"
                  value={createForm.phoneNumber}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/[^\d]/g, "") }))
                  }
                  placeholder="5551234567"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit vendor */}
      <Dialog open={Boolean(editVendor)} onOpenChange={(o) => !o && setEditVendor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
            <DialogDescription>
              Update this vendor&apos;s name and phone number. Email is the login identity and
              can&apos;t be changed here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="ev-name">Full name</Label>
              <Input
                id="ev-name"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={editVendor?.email || ""} disabled readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <div className="flex gap-2">
                <CountryCodeSelect
                  value={editForm.countryCode}
                  onValueChange={(value) => setEditForm((p) => ({ ...p, countryCode: value }))}
                  className="w-24 shrink-0"
                />
                <Input
                  aria-label="Phone number"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/[^\d]/g, "") }))
                  }
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVendor(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose scan access for this club immediately and are signed out on all devices.
              Their active event assignments stop working. You can re-add them later with the same
              email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeactivate()
              }}
              disabled={deactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
