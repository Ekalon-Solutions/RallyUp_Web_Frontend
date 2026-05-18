"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, MapPin, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TierDraft {
  id: string
  name: string
  price: number
  allocation: number
}

export interface VenueDraft {
  id: string
  name: string
  tiers: TierDraft[]
}

interface VenueTierMatrixBuilderProps {
  venues: VenueDraft[]
  onChange: (venues: VenueDraft[]) => void
  currency?: string
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export function VenueTierMatrixBuilder({ venues, onChange, currency = "INR" }: VenueTierMatrixBuilderProps) {
  const currencySymbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "CA$",
    JPY: "¥", BRL: "R$", MXN: "$", ZAR: "R",
  }
  const sym = currencySymbols[currency] ?? currency + " "

  const addVenue = () => {
    onChange([
      ...venues,
      {
        id: generateId(),
        name: "",
        tiers: [{ id: generateId(), name: "General", price: 0, allocation: 50 }],
      },
    ])
  }

  const removeVenue = (venueId: string) => {
    onChange(venues.filter((v) => v.id !== venueId))
  }

  const updateVenueName = (venueId: string, name: string) => {
    onChange(venues.map((v) => (v.id === venueId ? { ...v, name } : v)))
  }

  const addTier = (venueId: string) => {
    onChange(
      venues.map((v) =>
        v.id === venueId
          ? { ...v, tiers: [...v.tiers, { id: generateId(), name: "", price: 0, allocation: 50 }] }
          : v
      )
    )
  }

  const removeTier = (venueId: string, tierId: string) => {
    onChange(
      venues.map((v) =>
        v.id === venueId ? { ...v, tiers: v.tiers.filter((t) => t.id !== tierId) } : v
      )
    )
  }

  const updateTier = (venueId: string, tierId: string, field: keyof TierDraft, value: string | number) => {
    onChange(
      venues.map((v) =>
        v.id === venueId
          ? {
              ...v,
              tiers: v.tiers.map((t) => (t.id === tierId ? { ...t, [field]: value } : t)),
            }
          : v
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Venue & Tier Matrix</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add venues and ticket tiers — each combination has its own allocation.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addVenue}>
          <Plus className="w-4 h-4 mr-1" />
          Add Venue
        </Button>
      </div>

      {venues.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No venues added. Click <strong>Add Venue</strong> to start building the matrix, or leave empty to use the single-ticket mode above.
        </div>
      )}

      {venues.map((venue, vi) => (
        <Card key={venue.id} className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <Input
                  placeholder={`Venue ${vi + 1} name (e.g. North Stand, Main Hall)`}
                  value={venue.name}
                  onChange={(e) => updateVenueName(venue.id, e.target.value)}
                  className="font-medium"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVenue(venue.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Matrix header */}
            <div className="grid grid-cols-[1fr_100px_100px_36px] gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tier Name
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Price ({sym})
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Allocation
              </span>
              <span />
            </div>

            {venue.tiers.map((tier, ti) => (
              <div key={tier.id} className="grid grid-cols-[1fr_100px_100px_36px] gap-2 items-center">
                <Input
                  placeholder={`Tier ${ti + 1} (e.g. VIP, Basic)`}
                  value={tier.name}
                  onChange={(e) => updateTier(venue.id, tier.id, "name", e.target.value)}
                  className="text-sm"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {sym}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={tier.price}
                    onChange={(e) => updateTier(venue.id, tier.id, "price", Number(e.target.value) || 0)}
                    className="pl-6 text-sm"
                    placeholder="0"
                  />
                </div>
                <Input
                  type="number"
                  min={1}
                  value={tier.allocation}
                  onChange={(e) => updateTier(venue.id, tier.id, "allocation", Number(e.target.value) || 1)}
                  className="text-sm"
                  placeholder="50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTier(venue.id, tier.id)}
                  disabled={venue.tiers.length === 1}
                  className={cn(
                    "p-0 w-9 h-9",
                    venue.tiers.length === 1
                      ? "opacity-30 cursor-not-allowed"
                      : "text-destructive hover:text-destructive hover:bg-destructive/10"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTier(venue.id)}
              className="w-full border-dashed text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Tier
            </Button>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {venue.tiers.filter((t) => t.name).map((tier) => (
                <Badge key={tier.id} variant="secondary" className="text-xs">
                  {tier.name}: {sym}{tier.price.toLocaleString()} × {tier.allocation} seats
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {venues.length > 0 && (
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Matrix summary</p>
          {venues.map((v) => (
            <div key={v.id}>
              <span className="font-medium">{v.name || "(unnamed venue)"}</span>
              {" — "}
              {v.tiers.map((t) => `${t.name || "(tier)"}: ${t.allocation} seats`).join(", ")}
            </div>
          ))}
          <p className="pt-1">
            Total combos: {venues.reduce((n, v) => n + v.tiers.length, 0)} &nbsp;|&nbsp;
            Total allocation: {venues.reduce((n, v) => n + v.tiers.reduce((s, t) => s + t.allocation, 0), 0)} seats
          </p>
        </div>
      )}
    </div>
  )
}
