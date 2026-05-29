"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, MapPin, Tag, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { clubActionButtonClassName, clubActionButtonStyle } from "@/lib/clubThemeButton"
import {
  formatNumberInputValue,
  parseOptionalNonNegativeInt,
  parseOptionalNonNegativeNumber,
} from "@/lib/numberInput"

export interface ClubAllocationDraft {
  clubName: string
  allocation: number
}

export interface TierDraft {
  id: string
  name: string
  price: number
  allocation: number
  clubAllocations?: ClubAllocationDraft[]
}

export interface VenueDraft {
  id: string
  name: string
  tiers: TierDraft[]
}

type DeleteTarget =
  | { type: "venue"; venueId: string }
  | { type: "tier"; venueId: string; tierId: string }

interface VenueTierMatrixBuilderProps {
  venues: VenueDraft[]
  onChange: (venues: VenueDraft[]) => void
  currency?: string
  jointScreening?: { enabled: boolean; partnerClubNames: string[] }
  cardClassName?: string
  primaryColor?: string
  hideAddVenueButton?: boolean
  externalFirstVenueFields?: boolean
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function perClubAllocation(total: number, clubCount: number): number {
  if (clubCount <= 0 || total <= 0) return 0
  return Math.floor(total / clubCount)
}

function makeDefaultTier(
  jointScreening: VenueTierMatrixBuilderProps["jointScreening"],
  name = "General",
  price = 0,
  allocation = 0
): TierDraft {
  const isJointEvent = Boolean(
    jointScreening?.enabled && (jointScreening?.partnerClubNames?.length ?? 0) > 0
  )
  const clubNames = jointScreening?.partnerClubNames ?? []
  if (isJointEvent && clubNames.length > 0) {
    const perClub = perClubAllocation(allocation, clubNames.length)
    const clubAllocations = clubNames.map((cn) => ({ clubName: cn, allocation: perClub }))
    return { id: generateId(), name, price, allocation: perClub * clubNames.length, clubAllocations }
  }
  return { id: generateId(), name, price, allocation }
}

export function createEmptyVenueDraft(
  jointScreening?: VenueTierMatrixBuilderProps["jointScreening"]
): VenueDraft {
  return { id: generateId(), name: "", tiers: [makeDefaultTier(jointScreening)] }
}

export function VenueTierMatrixBuilder({
  venues,
  onChange,
  currency = "INR",
  jointScreening,
  cardClassName,
  primaryColor,
  hideAddVenueButton = false,
  externalFirstVenueFields = false,
}: VenueTierMatrixBuilderProps) {
  const clubBtnClass = clubActionButtonClassName()
  const clubBtnStyle = clubActionButtonStyle(primaryColor)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const currencySymbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "CA$",
    JPY: "¥", BRL: "R$", MXN: "$", ZAR: "R",
  }
  const sym = currencySymbols[currency] ?? currency + " "

  const isJointEvent = Boolean(
    jointScreening?.enabled && (jointScreening?.partnerClubNames?.length ?? 0) > 0
  )
  const clubNames = jointScreening?.partnerClubNames ?? []

  const makeDefaultTier = (name = "General", price = 0, allocation = 0): TierDraft => {
    if (isJointEvent && clubNames.length > 0) {
      const perClub = perClubAllocation(allocation, clubNames.length)
      const clubAllocations = clubNames.map((cn) => ({ clubName: cn, allocation: perClub }))
      return { id: generateId(), name, price, allocation: perClub * clubNames.length, clubAllocations }
    }
    return { id: generateId(), name, price, allocation }
  }

  const addVenue = () => {
    onChange([...venues, createEmptyVenueDraft(jointScreening)])
  }

  const removeVenue = (venueId: string) => {
    if (venues.length <= 1) return
    onChange(venues.filter((v) => v.id !== venueId))
  }

  useEffect(() => {
    if (venues.length === 0) {
      onChange([createEmptyVenueDraft(jointScreening)])
    }
  }, [venues.length])

  const updateVenueName = (venueId: string, name: string) => {
    onChange(venues.map((v) => (v.id === venueId ? { ...v, name } : v)))
  }

  const addTier = (venueId: string) => {
    onChange(
      venues.map((v) =>
        v.id === venueId
          ? { ...v, tiers: [...v.tiers, makeDefaultTier("", 0, 0)] }
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

  const requestRemoveVenue = (venueId: string) => {
    if (venues.length <= 1) return
    setDeleteTarget({ type: "venue", venueId })
  }

  const requestRemoveTier = (venueId: string, tierId: string) => {
    const venue = venues.find((v) => v.id === venueId)
    if (!venue || venue.tiers.length <= 1) return
    setDeleteTarget({ type: "tier", venueId, tierId })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "venue") {
      removeVenue(deleteTarget.venueId)
    } else {
      removeTier(deleteTarget.venueId, deleteTarget.tierId)
    }
    setDeleteTarget(null)
  }

  const deleteDialogCopy = (() => {
    if (!deleteTarget) return { title: "", description: "" }
    if (deleteTarget.type === "venue") {
      const venue = venues.find((v) => v.id === deleteTarget.venueId)
      const label = venue?.name?.trim() || `Venue ${venues.findIndex((v) => v.id === deleteTarget.venueId) + 1}`
      const tierCount = venue?.tiers.length ?? 0
      return {
        title: "Remove venue?",
        description: `Remove "${label}" and its ${tierCount} ticket tier${tierCount === 1 ? "" : "s"}? This cannot be undone.`,
      }
    }
    const venue = venues.find((v) => v.id === deleteTarget.venueId)
    const tier = venue?.tiers.find((t) => t.id === deleteTarget.tierId)
    const venueLabel = venue?.name?.trim() || "this venue"
    const tierLabel = tier?.name?.trim() || "this tier"
    return {
      title: "Remove ticket tier?",
      description: `Remove "${tierLabel}" from ${venueLabel}? This cannot be undone.`,
    }
  })()

  const updateTier = (venueId: string, tierId: string, field: keyof TierDraft, value: string | number | ClubAllocationDraft[] | undefined) => {
    onChange(
      venues.map((v) =>
        v.id === venueId
          ? { ...v, tiers: v.tiers.map((t) => (t.id === tierId ? { ...t, [field]: value } : t)) }
          : v
      )
    )
  }

  const toggleClubAllocations = (venueId: string, tierId: string, enabled: boolean) => {
    const tier = venues.find((v) => v.id === venueId)?.tiers.find((t) => t.id === tierId)
    if (!tier) return
    if (enabled) {
      // Distribute current allocation evenly across clubs as starting point
      const perClub = perClubAllocation(tier.allocation, clubNames.length)
      const clubAllocations: ClubAllocationDraft[] = clubNames.map((name) => ({ clubName: name, allocation: perClub }))
      updateTier(venueId, tierId, "clubAllocations", clubAllocations)
    } else {
      updateTier(venueId, tierId, "clubAllocations", undefined)
    }
  }

  const updateClubAllocation = (venueId: string, tierId: string, clubName: string, allocation: number) => {
    onChange(
      venues.map((v) =>
        v.id === venueId
          ? {
              ...v,
              tiers: v.tiers.map((t) => {
                if (t.id !== tierId) return t
                const updated = (t.clubAllocations ?? []).map((ca) =>
                  ca.clubName === clubName ? { ...ca, allocation } : ca
                )
                // Recalculate total allocation from sum of club allocations
                const total = updated.reduce((s, ca) => s + ca.allocation, 0)
                return { ...t, clubAllocations: updated, allocation: Math.max(0, total) }
              }),
            }
          : v
      )
    )
  }

  return (
    <div className="space-y-4">
      {!hideAddVenueButton && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Venue & Tier Matrix</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add venues and ticket tiers — each combination has its own allocation.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={clubBtnClass}
            style={clubBtnStyle}
            onClick={addVenue}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Venue
          </Button>
        </div>
      )}

      {venues.map((venue, vi) => {
        const hideVenueNameRow = externalFirstVenueFields && vi === 0
        const tiersToRender = externalFirstVenueFields && vi === 0 ? venue.tiers.slice(1) : venue.tiers

        return (
        <Card key={venue.id} className={cn("border-2", cardClassName)}>
          {!hideVenueNameRow && (
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
                onClick={() => requestRemoveVenue(venue.id)}
                disabled={venues.length <= 1}
                className={cn(
                  "flex-shrink-0",
                  venues.length <= 1
                    ? "opacity-30 cursor-not-allowed"
                    : "text-destructive hover:text-destructive hover:bg-destructive/10"
                )}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          )}

          <CardContent className={cn("space-y-4", hideVenueNameRow && "pt-6")}>
            {hideVenueNameRow && tiersToRender.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Additional ticket tiers
              </p>
            )}
            {externalFirstVenueFields && vi === 0 && venues.length > 1 && (
              <div className="flex items-center justify-between gap-2 pb-1">
                <p className="text-sm font-medium">{venue.name.trim() || "Venue 1"}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => requestRemoveVenue(venue.id)}
                  disabled={venues.length <= 1}
                  className={cn(
                    "flex-shrink-0",
                    venues.length <= 1
                      ? "opacity-30 cursor-not-allowed"
                      : "text-destructive hover:text-destructive hover:bg-destructive/10"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            {!(hideVenueNameRow && tiersToRender.length === 0) && (
            <div className="grid grid-cols-[1fr_100px_100px_36px] gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tier Name
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Price ({sym})
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isJointEvent ? "Total Seats" : "Allocation"}
              </span>
              <span />
            </div>
            )}

            {tiersToRender.map((tier, ti) => {
              const tierIndex = externalFirstVenueFields && vi === 0 ? ti + 1 : ti
              const hasClubAllocations = isJointEvent && Boolean(tier.clubAllocations?.length)
              return (
                <div key={tier.id} className="space-y-2">
                  <div className="grid grid-cols-[1fr_100px_100px_36px] gap-2 items-center">
                    <Input
                      placeholder={`Tier ${tierIndex + 1} (e.g. VIP, Basic)`}
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
                        value={formatNumberInputValue(tier.price)}
                        onChange={(e) =>
                          updateTier(venue.id, tier.id, "price", parseOptionalNonNegativeNumber(e.target.value))
                        }
                        className="pl-6 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={formatNumberInputValue(tier.allocation)}
                      onChange={(e) =>
                        updateTier(venue.id, tier.id, "allocation", parseOptionalNonNegativeInt(e.target.value))
                      }
                      className="text-sm"
                      placeholder="0"
                      disabled={hasClubAllocations}
                      title={hasClubAllocations ? "Auto-computed from club allocations" : undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => requestRemoveTier(venue.id, tier.id)}
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
                  
                  {isJointEvent && (
                    <div className={cn("ml-1 pl-3 border-l-2 border-border space-y-2", cardClassName)}>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          Per-club allocation
                        </Label>
                        <Switch
                          checked={hasClubAllocations}
                          onCheckedChange={(v) => toggleClubAllocations(venue.id, tier.id, v)}
                        />
                      </div>

                      {hasClubAllocations && (
                        <div className="grid gap-2 pt-1">
                          {(tier.clubAllocations ?? []).map((ca) => (
                            <div key={ca.clubName} className="flex items-center gap-2">
                              <span className="text-xs font-medium w-32 truncate flex-shrink-0">{ca.clubName}</span>
                              <Input
                                type="number"
                                min={0}
                                value={formatNumberInputValue(ca.allocation)}
                                onChange={(e) =>
                                  updateClubAllocation(
                                    venue.id,
                                    tier.id,
                                    ca.clubName,
                                    parseOptionalNonNegativeInt(e.target.value)
                                  )
                                }
                                className="h-8 text-xs w-24"
                                placeholder="0"
                              />
                              <span className="text-xs text-muted-foreground">seats</span>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">
                            Total: {(tier.clubAllocations ?? []).reduce((s, ca) => s + ca.allocation, 0)} seats
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addTier(venue.id)}
              className={cn("w-full text-xs", clubBtnClass)}
              style={clubBtnStyle}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Tier
            </Button>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {venue.tiers.filter((t) => t.name).map((tier) => (
                <Badge key={tier.id} variant="secondary" className="text-xs">
                  {tier.name}: {sym}{tier.price.toLocaleString()} × {tier.allocation} seats
                  {tier.clubAllocations?.length ? " (club-split)" : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        )
      })}

      {venues.length > 0 && (
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Matrix summary</p>
          {venues.map((v) => (
            <div key={v.id}>
              <span className="font-medium">{v.name || "(unnamed venue)"}</span>
              {" — "}
              {v.tiers.map((t) => {
                const base = `${t.name || "(tier)"}: ${t.allocation} seats`
                if (t.clubAllocations?.length) {
                  const breakdown = t.clubAllocations.map((ca) => `${ca.clubName}: ${ca.allocation}`).join(", ")
                  return `${base} (${breakdown})`
                }
                return base
              }).join(", ")}
            </div>
          ))}
          <p className="pt-1">
            Total combos: {venues.reduce((n, v) => n + v.tiers.length, 0)} &nbsp;|&nbsp;
            Total allocation: {venues.reduce((n, v) => n + v.tiers.reduce((s, t) => s + t.allocation, 0), 0)} seats
          </p>
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteDialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDialogCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
