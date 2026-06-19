"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MapPin, ShieldAlert, UserCheck, Zap } from "lucide-react"
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

type AssignmentRow = {
  _id: string
  vendorId: { _id: string; name?: string; email?: string } | string
  gateZone: string
  eventIds: string[]
  eventWindows?: Array<{ eventId: string; eventTitle?: string; needsTimingUpdate?: boolean }>
  isRevoked?: boolean
}

function formatEventTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function VendorAssignmentPanel() {
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
  const [gateZone, setGateZone] = useState("")
  const [gateType, setGateType] = useState<"general" | "vip" | "all">("all")
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
  }, [loadData])

  const activeAssignments = useMemo(
    () => assignments.filter((a) => !a.isRevoked),
    [assignments]
  )

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  const handleCreate = async () => {
    if (!clubId || !vendorId || !selectedEventIds.length || !gateZone.trim()) {
      toast.error("Select a vendor, at least one event, and a gate/zone")
      return
    }
    setSaving(true)
    try {
      const res = await apiClient.createVendorAssignment(clubId, {
        vendorId,
        eventIds: selectedEventIds,
        gateZone: gateZone.trim(),
        gateType,
      })
      if (res.success) {
        toast.success("Vendor assignment created")
        setSelectedEventIds([])
        setGateZone("")
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
          <CardDescription>Select an active club to manage bouncer assignments.</CardDescription>
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
          Link vendors to specific events and gates. Scanning activates 3 hours before kick-off and
          expires 2 hours after the event ends.
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.name || v.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gate / Zone</Label>
            <Input
              placeholder="e.g. Gate A, VIP Lounge"
              value={gateZone}
              onChange={(e) => setGateZone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Gate type</Label>
            <Select value={gateType} onValueChange={(v) => setGateType(v as typeof gateType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="general">General entry only</SelectItem>
                <SelectItem value="vip">VIP gate only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Events</Label>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events for this club.</p>
            ) : (
              events.map((event) => (
                <label
                  key={event._id}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedEventIds.includes(event._id)}
                    onChange={() => toggleEvent(event._id)}
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
              return (
                <div
                  key={row._id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{vendorLabel}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {row.gateZone}
                    </p>
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
