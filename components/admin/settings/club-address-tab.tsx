"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, MapPin } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { apiClient } from "@/lib/api"

interface ClubAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
}

export function ClubAddressTab() {
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [address, setAddress] = useState<ClubAddress>({
    street: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
  })

  useEffect(() => {
    if (clubId) {
      loadAddress()
    }
  }, [clubId])

  const loadAddress = async () => {
    if (!clubId) return
    try {
      setLoading(true)
      const response = await apiClient.getClubAddress(clubId)
      if (response.success) {
        const addr = (response.data as any)?.data ?? response.data
        if (addr && typeof addr === 'object') {
          setAddress({
            street: addr.street || "",
            city: addr.city || "",
            state: addr.state || "",
            country: addr.country || "India",
            zipCode: addr.zipCode || "",
          })
        }
      }
    } catch {
      toast.error("Failed to load club address")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!clubId) return
    try {
      setSaving(true)
      const response = await apiClient.updateClubAddress(clubId, address)
      if (response.success) {
        toast.success("Club address saved successfully")
        await loadAddress()
      } else {
        toast.error(response.message || "Failed to save address")
      }
    } catch {
      toast.error("Failed to save club address")
    } finally {
      setSaving(false)
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
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Shipping Pickup Address
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This address is used as the pickup location for Shiprocket shipping. The pincode (zip code) determines shipping cost calculation for merchandise orders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Club Address
          </CardTitle>
          <CardDescription>
            Warehouse or pickup location for shipping orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street / Address Line</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder="Building, street, area"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                placeholder="Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Pincode / Zip Code</Label>
              <Input
                id="zipCode"
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="6-digit pincode (India)"
                maxLength={10}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Address
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
