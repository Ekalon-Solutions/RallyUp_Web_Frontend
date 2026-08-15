"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Trash2, Star, Save } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { apiClient, type ClubPickupAddress } from "@/lib/api"

interface ClubAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
}

interface PickupForm {
  label: string
  name: string
  email: string
  phone: string
  houseNo: string
  street: string
  address2: string
  city: string
  state: string
  country: string
  zipCode: string
}

const emptyPickupForm: PickupForm = {
  label: "",
  name: "",
  email: "",
  phone: "",
  houseNo: "",
  street: "",
  address2: "",
  city: "",
  state: "",
  country: "India",
  zipCode: "",
}

function readableError(message?: string, fallback = "Something went wrong") {
  if (!message) return fallback
  try {
    const parsed = JSON.parse(message)
    if (parsed && typeof parsed === "object") {
      const parts = Object.values(parsed).flatMap((value) =>
        Array.isArray(value) ? value.map(String) : [String(value)]
      )
      if (parts.length) return parts.join(", ")
    }
  } catch {
    // already a human-readable string
  }
  return message
}

export function ClubAddressTab() {
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(true)
  const [savingClub, setSavingClub] = useState(false)
  const [savingPickup, setSavingPickup] = useState(false)
  const [clubAddress, setClubAddress] = useState<ClubAddress>({
    street: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
  })
  const [addresses, setAddresses] = useState<ClubPickupAddress[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PickupForm>(emptyPickupForm)

  useEffect(() => {
    if (clubId) {
      loadAll()
    }
  }, [clubId])

  const unwrap = <T,>(response: { data?: any }): T =>
    (response.data as any)?.data ?? response.data

  const loadAll = async () => {
    if (!clubId) return
    try {
      setLoading(true)
      const [clubRes, pickupRes] = await Promise.all([
        apiClient.getClubAddress(clubId),
        apiClient.getClubPickupAddresses(clubId),
      ])

      if (clubRes.success) {
        const addr = unwrap<ClubAddress>(clubRes)
        if (addr && typeof addr === "object") {
          setClubAddress({
            street: addr.street || "",
            city: addr.city || "",
            state: addr.state || "",
            country: addr.country || "India",
            zipCode: addr.zipCode || "",
          })
        }
      }

      if (!pickupRes.success) {
        toast.error(pickupRes.message || "Failed to load pickup addresses")
        return
      }

      const payload = unwrap<{
        pickupAddresses?: ClubPickupAddress[]
        contactDefaults?: { name?: string; email?: string; phone?: string }
      }>(pickupRes)
      const list = Array.isArray(payload?.pickupAddresses) ? payload.pickupAddresses : []
      setAddresses(list)
      setForm((prev) => ({
        ...prev,
        name: payload?.contactDefaults?.name || prev.name,
        email: payload?.contactDefaults?.email || prev.email,
        phone: payload?.contactDefaults?.phone || prev.phone,
      }))
      setShowForm(list.length === 0)
    } catch {
      toast.error("Failed to load addresses")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClubAddress = async () => {
    if (!clubId) return
    try {
      setSavingClub(true)
      const response = await apiClient.updateClubAddress(clubId, clubAddress)
      if (response.success) {
        toast.success("Club address saved")
        const addr = unwrap<ClubAddress>(response)
        if (addr && typeof addr === "object") {
          setClubAddress({
            street: addr.street || "",
            city: addr.city || "",
            state: addr.state || "",
            country: addr.country || "India",
            zipCode: addr.zipCode || "",
          })
        }
      } else {
        toast.error(response.message || "Failed to save club address")
      }
    } catch {
      toast.error("Failed to save club address")
    } finally {
      setSavingClub(false)
    }
  }

  const handleAddPickup = async () => {
    if (!clubId) return
    if (!form.label.trim()) {
      toast.error("Location name is required")
      return
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Contact name, email, and phone are required")
      return
    }
    if (!form.houseNo.trim()) {
      toast.error("House / Flat / Road number is required")
      return
    }
    if (!form.street.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Street, city, and state are required")
      return
    }
    if (!/^\d{6}$/.test(form.zipCode)) {
      toast.error("Pincode must be a 6-digit number")
      return
    }
    try {
      setSavingPickup(true)
      const response = await apiClient.addClubPickupAddress(clubId, {
        label: form.label.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        houseNo: form.houseNo.trim(),
        street: form.street.trim(),
        address2: form.address2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim() || "India",
        zipCode: form.zipCode.trim(),
      })
      if (!response.success) {
        toast.error(readableError(response.message || response.error, "Failed to add pickup address"))
        return
      }
      toast.success("Pickup address added and registered with Shiprocket")
      setForm((prev) => ({
        ...emptyPickupForm,
        name: prev.name,
        email: prev.email,
        phone: prev.phone,
        country: prev.country || "India",
      }))
      setShowForm(false)
      const pickupRes = await apiClient.getClubPickupAddresses(clubId)
      if (pickupRes.success) {
        const payload = unwrap<{ pickupAddresses?: ClubPickupAddress[] }>(pickupRes)
        setAddresses(Array.isArray(payload?.pickupAddresses) ? payload.pickupAddresses : [])
      }
    } catch {
      toast.error("Failed to add pickup address")
    } finally {
      setSavingPickup(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!clubId) return
    try {
      const response = await apiClient.deleteClubPickupAddress(clubId, addressId)
      if (!response.success) {
        toast.error(response.message || "Failed to remove pickup address")
        return
      }
      toast.success("Pickup address removed")
      const payload = unwrap<{ pickupAddresses?: ClubPickupAddress[] }>(response)
      if (Array.isArray(payload?.pickupAddresses)) {
        setAddresses(payload.pickupAddresses)
      }
    } catch {
      toast.error("Failed to remove pickup address")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!clubId) return
    try {
      const response = await apiClient.setDefaultClubPickupAddress(clubId, addressId)
      if (!response.success) {
        toast.error(response.message || "Failed to set default pickup address")
        return
      }
      toast.success("Default pickup address updated")
      const payload = unwrap<{ pickupAddresses?: ClubPickupAddress[] }>(response)
      if (Array.isArray(payload?.pickupAddresses)) {
        setAddresses(payload.pickupAddresses)
      }
    } catch {
      toast.error("Failed to set default pickup address")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Club Address
          </CardTitle>
          <CardDescription>
            Public club location. This is not sent to Shiprocket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-street">Street / Address Line</Label>
            <Input
              id="club-street"
              value={clubAddress.street}
              onChange={(e) => setClubAddress({ ...clubAddress, street: e.target.value })}
              placeholder="Building, street, area"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="club-city">City</Label>
              <Input
                id="club-city"
                value={clubAddress.city}
                onChange={(e) => setClubAddress({ ...clubAddress, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-state">State</Label>
              <Input
                id="club-state"
                value={clubAddress.state}
                onChange={(e) => setClubAddress({ ...clubAddress, state: e.target.value })}
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="club-country">Country</Label>
              <Input
                id="club-country"
                value={clubAddress.country}
                onChange={(e) => setClubAddress({ ...clubAddress, country: e.target.value })}
                placeholder="Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-zipCode">Pincode / Zip Code</Label>
              <Input
                id="club-zipCode"
                value={clubAddress.zipCode}
                onChange={(e) => setClubAddress({ ...clubAddress, zipCode: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="Pincode"
                maxLength={10}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveClubAddress} disabled={savingClub}>
              {savingClub ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save club address
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Shipping Pickup Addresses
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                These warehouse addresses are registered with Shiprocket and appear in the merchandise pickup dropdown. Shiprocket requires a house / flat / road number on address line 1.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pickup Addresses
            </CardTitle>
            <CardDescription>
              Separate from the club address. Used only for shipping pickup.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm((open) => !open)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Close" : "Add pickup address"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {addresses.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground">
              No pickup addresses yet. Add a warehouse address to ship merchandise.
            </p>
          ) : null}

          {addresses.map((addr) => (
            <div
              key={addr._id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{addr.label}</p>
                  {addr.isDefault ? <Badge variant="secondary">Default pickup</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[addr.street, addr.address2, addr.city, addr.state, addr.zipCode, addr.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {addr.name} · {addr.phone}
                  {addr.pickupLocation ? ` · ${addr.pickupLocation}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!addr.isDefault ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSetDefault(addr._id)}>
                    <Star className="h-4 w-4 mr-1" />
                    Default
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(addr._id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add pickup address</CardTitle>
            <CardDescription>
              Registered with Shiprocket. Include house / flat / road number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label">Location name</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Main warehouse"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact name</Label>
                <Input
                  id="contactName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Warehouse manager"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="warehouse@club.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (10 digits)</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="houseNo">House / Flat / Road no.</Label>
                <Input
                  id="houseNo"
                  value={form.houseNo}
                  onChange={(e) => setForm({ ...form, houseNo: e.target.value })}
                  placeholder="12A or Plot 7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Street / Area</Label>
                <Input
                  id="street"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="MG Road, Andheri East"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2">Address line 2 (optional)</Label>
              <Input
                id="address2"
                value={form.address2}
                onChange={(e) => setForm({ ...form, address2: e.target.value })}
                placeholder="Landmark, floor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Pincode / Zip Code</Label>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddPickup} disabled={savingPickup} size="lg">
                {savingPickup ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add pickup address
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
