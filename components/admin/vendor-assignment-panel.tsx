"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Zap,
  Plus,
  X,
  DoorOpen,
} from "lucide-react"
import { toast } from "sonner"

type ClubEvent = {
  _id: string
  title: string
  startTime?: string
  venue?: string
}

type VendorRow = {
  _id: string
  name: string
  email: string
}

type AssignmentGate = {
  venueId?: string
  venueName?: string
  tierId?: string
  tierName?: string
  label: string
  gateType?: "general" | "vip" | "all"
}

type AssignmentRow = {
  _id: string
  vendorId: { _id: string; name?: string; email?: string } | string
  gateZone: string
  gates?: AssignmentGate[]
  eventIds: string[]
  eventWindows?: Array<{ eventId: string; eventTitle?: string; needsTimingUpdate?: boolean }>
  isRevoked?: boolean
}

type GateOption = {
  eventId: string
  eventTitle: string
  fallbackVenue?: string
  hasStructuredVenues: boolean
  venues: Array<{
    venueId: string
    venueName: string
    tiers: Array<{ tierId: string; tierName: string; price: number }>
  }>
}

// A gate the admin has selected. `key` is stable for toggling/dedup.
type GateChoice = {
  key: string
  label: string
  venueId?: string
  venueName?: string
  tierId?: string
  tierName?: string
}

function formatEventTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

type VendorAssignmentPanelProps = {
  /** Bump to re-fetch the vendor dropdown when a vendor is added/edited elsewhere. */
  refreshSignal?: number
}

export function VendorAssignmentPanel({ refreshSignal }: VendorAssignmentPanelProps = {}) {
  const [clubId, setClubId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [reschedulePrompts, setReschedulePrompts] = useState<
    Array<{ assignmentId: string; gateZone: string; events: Array<{ eventTitle?: string }> }>
  >([])

  const [vendorId, setVendorId] = useState("")
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [gateOptions, setGateOptions] = useState<GateOption[]>([])
  const [loadingGates, setLoadingGates] = useState(false)
  const [selectedGates, setSelectedGates] = useState<GateChoice[]>([])
  const [allAccess, setAllAccess] = useState(false)
  const [customGate, setCustomGate] = useState("")
  const [overrideEventId, setOverrideEventId] = useState("")
  const [generatedOverrideCode, setGeneratedOverrideCode] = useState<string | null>(null)

  const loadData = useCallback(async (activeClubId: string) => {
    setLoading(true)
    try {
      const [vendorRes, eventRes, assignRes, promptRes] = await Promise.all([
        apiClient.listClubVendors(activeClubId),
        apiClient.getEventsByClub(activeClubId),
        apiClient.listVendorAssignments(activeClubId),
        apiClient.getVendorAssignmentReschedulePrompts(activeClubId),
      ])

      if (vendorRes.success && vendorRes.data) {
        setVendors(vendorRes.data as VendorRow[])
      }
      if (eventRes.success && eventRes.data) {
        const upcoming = (eventRes.data as ClubEvent[]).filter((e) => {
          if (!e.startTime) return true
          const end = new Date(e.startTime).getTime() + 5 * 60 * 60 * 1000
          return end >= Date.now()
        })
        setEvents(upcoming)
      }
      if (assignRes.success && assignRes.data) {
        setAssignments(assignRes.data as AssignmentRow[])
      }
      if (promptRes.success && promptRes.data) {
        setReschedulePrompts(promptRes.data)
      }
    } catch {
      toast.error("Failed to load vendor assignments")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("activeClubId") : null
    setClubId(id)
    if (id) void loadData(id)
    else setLoading(false)
  }, [loadData, refreshSignal])

  // Fetch the real venues + ticket tiers (gate/zone options) for the chosen events.
  useEffect(() => {
    if (!clubId || selectedEventIds.length === 0) {
      setGateOptions([])
      return
    }
    let cancelled = false
    setLoadingGates(true)
    apiClient
      .getVendorAssignmentGateOptions(clubId, selectedEventIds)
      .then((res) => {
        if (cancelled) return
        setGateOptions(res.success && res.data ? res.data : [])
      })
      .finally(() => {
        if (!cancelled) setLoadingGates(false)
      })
    return () => {
      cancelled = true
    }
  }, [clubId, selectedEventIds])

  const activeAssignments = useMemo(
    () => assignments.filter((a) => !a.isRevoked),
    [assignments]
  )

  // Unique venues across all selected events, tiers merged by id.
  const venueChoices = useMemo(() => {
    const map = new Map<
      string,
      { venueId: string; venueName: string; tiers: Map<string, { tierName: string; price: number }> }
    >()
    let hasUnstructuredEvent = false
    for (const opt of gateOptions) {
      if (!opt.hasStructuredVenues) hasUnstructuredEvent = true
      for (const v of opt.venues) {
        const existing = map.get(v.venueId)
        const tierMap = existing?.tiers ?? new Map()
        for (const t of v.tiers) tierMap.set(t.tierId, { tierName: t.tierName, price: t.price })
        if (!existing) map.set(v.venueId, { venueId: v.venueId, venueName: v.venueName, tiers: tierMap })
      }
    }
    return {
      venues: [...map.values()].map((v) => ({ ...v, tiers: [...v.tiers.entries()] })),
      hasUnstructuredEvent,
    }
  }, [gateOptions])

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  const isGateSelected = (key: string) => selectedGates.some((g) => g.key === key)

  const toggleGate = (choice: GateChoice) => {
    setSelectedGates((prev) =>
      prev.some((g) => g.key === choice.key)
        ? prev.filter((g) => g.key !== choice.key)
        : [...prev, choice]
    )
  }

  const removeGate = (key: string) => setSelectedGates((prev) => prev.filter((g) => g.key !== key))

  const addCustomGate = () => {
    const label = customGate.trim()
    if (!label) return
    const key = `custom::${label.toLowerCase()}`
    if (!isGateSelected(key)) {
      setSelectedGates((prev) => [...prev, { key, label }])
    }
    setCustomGate("")
  }

  // Events with no venue/tier matrix can't be scoped by gate — vendor gets all access.
  const noStructuredVenues =
    selectedEventIds.length > 0 && !loadingGates && venueChoices.venues.length === 0
  const effectiveAllAccess = allAccess || noStructuredVenues

  const resetForm = () => {
    setSelectedEventIds([])
    setSelectedGates([])
    setAllAccess(false)
    setCustomGate("")
    setGateOptions([])
  }

  const handleCreate = async () => {
    if (!clubId || !vendorId || !selectedEventIds.length) {
      toast.error("Select a vendor and at least one event")
      return
    }
    if (!effectiveAllAccess && !selectedGates.length) {
      toast.error("Select at least one gate / zone, or grant All access")
      return
    }
    setSaving(true)
    try {
      const gates = effectiveAllAccess
        ? [{ allAccess: true }]
        : selectedGates.map((g) =>
            g.tierId
              ? { venueId: g.venueId, tierId: g.tierId }
              : g.venueId
                ? { venueId: g.venueId }
                : { label: g.label }
          )
      const res = await apiClient.createVendorAssignment(clubId, {
        vendorId,
        eventIds: selectedEventIds,
        gates,
      })
      if (res.success) {
        toast.success("Vendor assignment created")
        resetForm()
        await loadData(clubId)
      } else {
        toast.error(res.error || res.message || "Failed to create assignment")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (assignmentId: string) => {
    if (!clubId) return
    try {
      const res = await apiClient.revokeVendorAssignment(clubId, assignmentId)
      if (res.success) {
        toast.success("Assignment revoked — vendor app will update within seconds")
        await loadData(clubId)
      } else {
        toast.error(res.error || res.message || "Revoke failed")
      }
    } catch {
      toast.error("Revoke failed")
    }
  }

  const handleSyncTimings = async (assignmentId: string) => {
    if (!clubId) return
    try {
      const res = await apiClient.syncVendorAssignmentTimings(clubId, assignmentId)
      if (res.success) {
        toast.success("Assignment timings updated to match event schedule")
        await loadData(clubId)
      } else {
        toast.error(res.error || res.message || "Sync failed")
      }
    } catch {
      toast.error("Sync failed")
    }
  }

  const handleGenerateOverride = async () => {
    if (!clubId || !overrideEventId) {
      toast.error("Select an event for override code generation")
      return
    }
    try {
      const res = await apiClient.generateVendorOverrideCode(clubId, overrideEventId)
      if (res.success && res.data?.code) {
        setGeneratedOverrideCode(res.data.code)
        toast.success("Override code generated — share with gate staff")
      } else {
        toast.error(res.error || res.message || "Failed to generate code")
      }
    } catch {
      toast.error("Failed to generate override code")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!clubId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Assignments</CardTitle>
          <CardDescription>Select an active club to manage vendor assignments.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Vendor Event Assignments
        </CardTitle>
        <CardDescription>
          Link a vendor to events, then pick which gates/zones (ticket tiers) they can scan — a
          vendor can cover multiple gates across venues. Scanning activates 3 hours before kick-off
          and expires 2 hours after the event ends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {reschedulePrompts.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <ShieldAlert className="h-4 w-4" />
              Event rescheduled — update assignment timings?
            </div>
            <ul className="space-y-2 text-sm">
              {reschedulePrompts.map((p) => (
                <li key={p.assignmentId} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {p.gateZone}: {p.events.map((e) => e.eventTitle || "Event").join(", ")}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleSyncTimings(p.assignmentId)}>
                    Auto-update timings
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 1 — vendor */}
        <div className="space-y-2 max-w-sm">
          <Label>
            <span className="text-xs font-semibold text-muted-foreground">Step 1</span> · Vendor
          </Label>
          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No vendors yet — add one in the Vendors list above.
                </div>
              ) : (
                vendors.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.name || v.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2 — events */}
        <div className="space-y-2">
          <Label>
            <span className="text-xs font-semibold text-muted-foreground">Step 2</span> · Events
          </Label>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events for this club.</p>
            ) : (
              events.map((event) => (
                <label
                  key={event._id}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    className="mt-1"
                    checked={selectedEventIds.includes(event._id)}
                    onCheckedChange={() => toggleEvent(event._id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventTime(event.startTime)}
                      {event.venue ? ` · ${event.venue}` : ""}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Step 3 — gates / zones */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            <span>
              <span className="text-xs font-semibold text-muted-foreground">Step 3</span> · Gates /
              Zones
            </span>
          </Label>

          {selectedEventIds.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Select one or more events above to see their venues and ticket tiers.
            </p>
          ) : loadingGates ? (
            <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading venues &amp; tiers…
            </div>
          ) : effectiveAllAccess ? (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium">All access</p>
                  <p className="text-sm text-muted-foreground">
                    {noStructuredVenues
                      ? "The selected event(s) have a single venue and no ticket tiers, so there are no gates to scope by — this vendor can scan every ticket for them."
                      : "This vendor can scan every ticket — no gate or venue restriction."}
                  </p>
                </div>
              </div>
              {!noStructuredVenues && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={allAccess}
                    onCheckedChange={(v) => setAllAccess(v === true)}
                  />
                  Grant all access (ignore specific gates)
                </label>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* All-access toggle (events do have a venue/tier matrix) */}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/40">
                <Checkbox checked={allAccess} onCheckedChange={(v) => setAllAccess(v === true)} />
                <span className="text-sm">
                  <span className="font-medium">All access</span> — scan every ticket (no gate /
                  venue restriction)
                </span>
              </label>

              {/* Selected gate chips */}
              {selectedGates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedGates.map((g) => (
                    <Badge key={g.key} variant="secondary" className="gap-1 pr-1">
                      {g.label}
                      <button
                        type="button"
                        onClick={() => removeGate(g.key)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-background/60"
                        aria-label={`Remove ${g.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Structured venue → tier picker */}
              {venueChoices.venues.map((venue) => (
                <div key={venue.venueId} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {venue.venueName}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {/* Whole-venue gate */}
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                      <Checkbox
                        checked={isGateSelected(`${venue.venueId}::all`)}
                        onCheckedChange={() =>
                          toggleGate({
                            key: `${venue.venueId}::all`,
                            label: `${venue.venueName} · All gates`,
                            venueId: venue.venueId,
                            venueName: venue.venueName,
                          })
                        }
                      />
                      <span className="text-sm italic text-muted-foreground">All gates</span>
                    </label>
                    {venue.tiers.map(([tierId, tier]) => (
                      <label
                        key={tierId}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={isGateSelected(`${venue.venueId}::${tierId}`)}
                          onCheckedChange={() =>
                            toggleGate({
                              key: `${venue.venueId}::${tierId}`,
                              label: `${venue.venueName} · ${tier.tierName}`,
                              venueId: venue.venueId,
                              venueName: venue.venueName,
                              tierId,
                              tierName: tier.tierName,
                            })
                          }
                        />
                        <span className="text-sm">{tier.tierName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Free-text gate — for mixed selections where some events have no tier matrix */}
              {venueChoices.hasUnstructuredEvent && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Some selected events have no tier matrix — add a custom gate/zone name, or leave
                    it and use All access above.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Gate A, VIP Lounge"
                      value={customGate}
                      onChange={(e) => setCustomGate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomGate()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomGate}>
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleCreate} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create assignment
        </Button>

        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <h4 className="text-sm font-semibold">Master Admin Override</h4>
          <p className="text-xs text-muted-foreground">
            Generate a short-lived code for gate staff to lift venue locks during bottlenecks.
          </p>
          <div className="flex flex-wrap gap-2">
            <Select value={overrideEventId} onValueChange={setOverrideEventId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Event for override" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => void handleGenerateOverride()}>
              Generate code
            </Button>
          </div>
          {generatedOverrideCode && (
            <p className="font-mono text-lg font-bold tracking-widest text-emerald-700">
              {generatedOverrideCode}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Active assignments</h4>
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active vendor assignments yet.</p>
          ) : (
            activeAssignments.map((row) => {
              const vendorLabel =
                typeof row.vendorId === "object"
                  ? row.vendorId.name || row.vendorId.email || "Vendor"
                  : String(row.vendorId)
              const needsUpdate = row.eventWindows?.some((w) => w.needsTimingUpdate)
              const gateList =
                row.gates && row.gates.length
                  ? row.gates.map((g) => g.label)
                  : row.gateZone
                    ? [row.gateZone]
                    : []
              return (
                <div
                  key={row._id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-2">
                    <p className="font-medium">{vendorLabel}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {gateList.length ? (
                        gateList.map((label) => (
                          <Badge key={label} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No gate set</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(row.eventWindows || []).map((w) => (
                        <Badge key={String(w.eventId)} variant="secondary" className="text-xs">
                          {w.eventTitle || "Event"}
                        </Badge>
                      ))}
                    </div>
                    {needsUpdate && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Timings need update
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {needsUpdate && (
                      <Button size="sm" variant="outline" onClick={() => handleSyncTimings(row._id)}>
                        Sync timings
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() => handleRevoke(row._id)}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Live-Revoke
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
