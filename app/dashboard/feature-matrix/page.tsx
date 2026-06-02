"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Search, Save, Grid3X3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { ClubFeatureKey } from "@/lib/clubFeatures"
import { CLUB_FEATURE_KEYS } from "@/lib/clubFeatures"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type MatrixClub = {
  clubId: string
  name: string
  slug: string
  status: string
  billing_tier: string
  billing_status: string
  flags: Array<{ key: string; enabled: boolean; state: string; label: string }>
  estimated_monthly_usd: number
}

const STATE_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-muted-foreground/40",
  trial: "bg-amber-500",
  limited: "bg-orange-500",
}

const SESSION_LOCK_MS = 15 * 60 * 1000

export default function FeatureMatrixPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [clubs, setClubs] = useState<MatrixClub[]>([])
  const [tooltips, setTooltips] = useState<Record<string, string>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Record<string, Record<string, boolean>>>({})
  const [dirtyClubId, setDirtyClubId] = useState<string | null>(null)
  const [bulkTier, setBulkTier] = useState("pro")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [locked, setLocked] = useState(false)

  const touchActivity = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("feature-matrix-last-active", String(Date.now()))
    }
  }, [])

  useEffect(() => {
    const check = () => {
      const raw = sessionStorage.getItem("feature-matrix-last-active")
      const last = raw ? parseInt(raw, 10) : Date.now()
      if (Date.now() - last > SESSION_LOCK_MS) {
        setLocked(true)
      }
    }
    check()
    const id = setInterval(check, 30_000)
    const onActivity = () => {
      sessionStorage.setItem("feature-matrix-last-active", String(Date.now()))
      setLocked(false)
    }
    window.addEventListener("mousemove", onActivity)
    window.addEventListener("keydown", onActivity)
    return () => {
      clearInterval(id)
      window.removeEventListener("mousemove", onActivity)
      window.removeEventListener("keydown", onActivity)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getClubFeatureMatrix(search.trim() || undefined)
      if (res.success && res.data) {
        const rows = (res.data.clubs as MatrixClub[]).map((club) => ({
          ...club,
          flags: Array.isArray(club.flags) ? club.flags : [],
        }))
        setClubs(rows)
        setTooltips(res.data.tooltips || {})
        setLabels(res.data.labels || {})
        setPending({})
        setDirtyClubId(null)
      }
    } catch {
      toast.error("Failed to load service matrix")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const clubFlags = (club: MatrixClub) => club.flags ?? []

  const getPendingEnabled = (club: MatrixClub, key: string) => {
    const p = pending[club.clubId]
    if (p && key in p) return p[key]
    return clubFlags(club).find((f) => f.key === key)?.enabled ?? false
  }

  const getPendingState = (club: MatrixClub, key: string) => {
    const enabled = getPendingEnabled(club, key)
    const original = clubFlags(club).find((f) => f.key === key)
    if (pending[club.clubId]?.[key] !== undefined) {
      return enabled ? "active" : "inactive"
    }
    return original?.state || (enabled ? "active" : "inactive")
  }

  const toggleCell = (clubId: string, key: string, enabled: boolean) => {
    touchActivity()
    setPending((prev) => ({
      ...prev,
      [clubId]: { ...(prev[clubId] || {}), [key]: enabled },
    }))
    setDirtyClubId(clubId)
  }

  const saveClub = async (club: MatrixClub) => {
    const updates = pending[club.clubId]
    if (!updates || !Object.keys(updates).length) return

    touchActivity()
    const payload: Record<string, { enabled: boolean }> = {}
    for (const [key, enabled] of Object.entries(updates)) {
      payload[key] = { enabled }
    }

    try {
      const res = await apiClient.patchClubFeatures(club.clubId, {
        updates: payload,
        reasonCode: "service_matrix_save",
      })
      if (res.success) {
        toast.success(`Saved features for ${club.name}`)
        await load()
      } else {
        toast.error(res.message || "Save failed")
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  const applyBulkTier = async () => {
    if (!selectedIds.length) {
      toast.error("Select at least one club")
      return
    }
    touchActivity()
    try {
      const res = await apiClient.bulkApplyClubBillingTier(selectedIds, bulkTier, "bulk_matrix")
      if (res.success) {
        toast.success(`Applied ${bulkTier} tier to ${res.data?.updated ?? selectedIds.length} clubs`)
        setSelectedIds([])
        await load()
      }
    } catch {
      toast.error("Bulk tier update failed")
    }
  }

  const premiumKeys = useMemo(
    () => CLUB_FEATURE_KEYS.filter((k) => ["wa_marketing", "ads", "predictions", "reporting"].includes(k)),
    []
  )

  if (user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Only system owners can access the Service Matrix.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (locked) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
            <h2 className="text-xl font-bold">Session locked</h2>
            <p className="text-muted-foreground text-center max-w-md">
              The Service Matrix locked after 15 minutes of inactivity. Move your mouse or press a key to continue.
            </p>
            <Button onClick={() => { touchActivity(); setLocked(false) }}>Unlock</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Grid3X3 className="h-7 w-7 text-primary" />
              Service Matrix
            </h1>
            <p className="text-muted-foreground text-sm">
              Toggle club modules (Phase 3A — Feature Selector). Changes sync to connected admin sessions instantly.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters & bulk actions</CardTitle>
              <CardDescription>Search clubs and apply billing tiers to a cohort.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, slug, or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={bulkTier} onValueChange={setBulkTier}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={applyBulkTier} disabled={!selectedIds.length}>
                Apply tier to {selectedIds.length || "…"} clubs
              </Button>
            </CardContent>
          </Card>

          <div className="border rounded-xl overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 sticky left-0 bg-background z-10" />
                  <TableHead className="min-w-[180px] sticky left-8 bg-background z-10">Club</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Est. $/mo</TableHead>
                  {CLUB_FEATURE_KEYS.map((key) => (
                    <TableHead key={key} className="text-center min-w-[72px] px-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] font-bold cursor-help line-clamp-2">
                              {(labels[key] || key).split(" ")[0]}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{tooltips[key] || labels[key] || key}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  ))}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={CLUB_FEATURE_KEYS.length + 5} className="text-center py-12 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : clubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={CLUB_FEATURE_KEYS.length + 5} className="text-center py-12 text-muted-foreground">
                      No clubs found
                    </TableCell>
                  </TableRow>
                ) : (
                  clubs.map((club) => (
                    <TableRow key={club.clubId}>
                      <TableCell className="sticky left-0 bg-background">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(club.clubId)}
                          onChange={(e) => {
                            setSelectedIds((ids) =>
                              e.target.checked
                                ? [...ids, club.clubId]
                                : ids.filter((id) => id !== club.clubId)
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell className="sticky left-8 bg-background font-medium">
                        <div className="truncate max-w-[160px]">{club.name}</div>
                        <div className="text-[10px] text-muted-foreground">{club.slug}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {club.billing_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">${club.estimated_monthly_usd}</TableCell>
                      {CLUB_FEATURE_KEYS.map((key) => {
                        const enabled = getPendingEnabled(club, key)
                        const state = getPendingState(club, key)
                        return (
                          <TableCell key={key} className="text-center px-1">
                            <div
                              className="inline-flex flex-col items-center gap-0.5"
                              title={tooltips[key]}
                            >
                              <span
                                className={`h-3 w-3 rounded-full ${STATE_COLORS[state] || STATE_COLORS.inactive}`}
                              />
                              <Switch
                                checked={enabled}
                                className="scale-75"
                                onCheckedChange={(checked) =>
                                  toggleCell(club.clubId, key, checked)
                                }
                              />
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell>
                        {dirtyClubId === club.clubId && pending[club.clubId] && (
                          <Button size="sm" onClick={() => saveClub(club)}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            Traffic light: green = active, gray = off, amber = trial, orange = limited. Premium keys:{" "}
            {premiumKeys.join(", ")}.
          </p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
