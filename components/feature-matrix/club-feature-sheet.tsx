"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, AlertTriangle, Zap, FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  CLUB_FEATURE_KEYS,
  FEATURE_DEPENDENCIES,
  FEATURE_CONSTRAINT_KEY,
} from "@/lib/clubFeatures"
import type { ClubFeatureKey } from "@/lib/clubFeatures"
import { CONSTRAINT_LABELS } from "@/lib/billingConstraints"
import { apiClient } from "@/lib/api"
import type { MatrixClub } from "./matrix-table"
import { DependencyWarningDialog } from "./dependency-warning-dialog"
import type { DependencyConflict } from "./dependency-warning-dialog"

// ── Feature groupings ────────────────────────────────────────────────────────

const FEATURE_GROUPS: {
  id: string
  label: string
  tier: string
  tierColor: string
  keys: ClubFeatureKey[]
}[] = [
  {
    id: "core",
    label: "Core",
    tier: "Free",
    tierColor: "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400",
    keys: ["events", "news", "membership", "website", "refunds"],
  },
  {
    id: "engagement",
    label: "Engagement",
    tier: "Starter",
    tierColor: "border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-400",
    keys: ["gallery", "polls", "chants", "external_ticketing", "volunteer"],
  },
  {
    id: "commerce",
    label: "Commerce & Growth",
    tier: "Pro",
    tierColor: "border-violet-300 text-violet-600 dark:border-violet-800 dark:text-violet-400",
    keys: ["merchandise", "leaderboard", "coupons", "onboarding", "reporting"],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    tier: "Enterprise",
    tierColor: "border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-400",
    keys: ["wa_marketing", "ads", "predictions"],
  },
]

const TIER_SELECT_COLOR: Record<string, string> = {
  free:       "text-slate-600",
  starter:    "text-blue-600",
  pro:        "text-violet-600",
  enterprise: "text-amber-600",
}

// ── Local state shape ────────────────────────────────────────────────────────

type SheetState = {
  billing_tier: string
  billing_status: string
  /** Null-safe flag map — missing legacy keys default to false */
  flags: Record<string, boolean>
  /** Numeric usage caps for constrained features */
  constraints: Record<string, number>
  experimental: Record<string, { enabled: boolean; state: string }>
  platformFeePercent: number
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  club: MatrixClub | null
  labels: Record<string, string>
  tooltips: Record<string, string>
  onClose: () => void
  onSaved: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export function ClubFeatureSheet({ club, labels, tooltips, onClose, onSaved }: Props) {
  const [state, setState] = useState<SheetState | null>(null)
  const [saving, setSaving] = useState(false)
  const [depConflicts, setDepConflicts] = useState<DependencyConflict[]>([])

  // Initialise from club data every time a new club is opened.
  useEffect(() => {
    if (!club) { setState(null); return }
    const flags: Record<string, boolean> = {}
    // Null-safe: any key absent from the club's flags array is treated as false
    // (handles legacy documents that predate a schema version bump).
    for (const key of CLUB_FEATURE_KEYS) {
      flags[key] = club.flags.find((f) => f.key === key)?.enabled ?? false
    }
    setState({
      billing_tier:   club.billing_tier,
      billing_status: club.billing_status,
      flags,
      constraints: { ...(club.feature_constraints ?? {}) },
      experimental: { ...(club.experimental_flags ?? {}) },
      platformFeePercent: club.platformFeePercent ?? 5,
    })
  }, [club])

  // ── Dirty-state derived values ───────────────────────────────────────────

  const diff = useMemo(() => {
    if (!club || !state) return { flagCount: 0, billing: false, constraints: false, any: false }
    let flagCount = 0
    for (const key of CLUB_FEATURE_KEYS) {
      const original = club.flags.find((f) => f.key === key)?.enabled ?? false
      if (state.flags[key] !== original) flagCount++
    }
    const billing =
      state.billing_tier   !== club.billing_tier ||
      state.billing_status !== club.billing_status
    const origC = club.feature_constraints ?? {}
    const constraints = Object.keys({ ...origC, ...state.constraints }).some(
      (k) => (state.constraints[k] ?? 0) !== (origC[k] ?? 0)
    )
    const origExp = club.experimental_flags ?? {}
    let expCount = 0
    for (const key of Object.keys(state.experimental)) {
      if ((state.experimental[key]?.enabled ?? false) !== (origExp[key]?.enabled ?? false)) expCount++
    }
    const platformFee = (state.platformFeePercent ?? 5) !== (club.platformFeePercent ?? 5)
    return { flagCount, billing, constraints, expCount, platformFee, any: flagCount > 0 || billing || constraints || expCount > 0 || platformFee }
  }, [club, state])

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleToggle = (key: ClubFeatureKey, checked: boolean) => {
    // Dependency check: block disabling a feature that others depend on
    if (!checked) {
      const deps = FEATURE_DEPENDENCIES[key]
      if (deps) {
        const active = deps.filter((d) => state?.flags[d] ?? false)
        if (active.length > 0) {
          setDepConflicts([{
            featureBeingDisabled: key,
            disabledLabel: labels[key] || key,
            dependents: active.map((d) => ({ key: d, label: labels[d] || d })),
          }])
          return
        }
      }
    }
    setState((s) => s ? { ...s, flags: { ...s.flags, [key]: checked } } : s)
  }

  const handleConstraint = (constraintKey: string, raw: string) => {
    const n = parseInt(raw, 10)
    setState((s) =>
      s ? {
        ...s,
        constraints: {
          ...s.constraints,
          [constraintKey]: isNaN(n) ? 0 : Math.max(0, n),
        },
      } : s
    )
  }

  const handleExperimentalToggle = (key: string, checked: boolean) => {
    setState((s) =>
      s ? {
        ...s,
        experimental: {
          ...s.experimental,
          [key]: { ...(s.experimental[key] ?? { state: "inactive" }), enabled: checked },
        },
      } : s
    )
  }

  // Atomic save: flags + experimental flags + billing + constraints in one PATCH
  const handleSave = async () => {
    if (!club || !state) return
    setSaving(true)
    try {
      const updates: Record<string, { enabled: boolean }> = {}
      for (const key of CLUB_FEATURE_KEYS) {
        const original = club.flags.find((f) => f.key === key)?.enabled ?? false
        if (state.flags[key] !== original) updates[key] = { enabled: state.flags[key] }
      }

      // Experimental flag changes — null-safe diff against original document
      const origExp = club.experimental_flags ?? {}
      const experimental_updates: Record<string, { enabled: boolean; state: string }> = {}
      for (const key of Object.keys(state.experimental)) {
        const origEnabled = origExp[key]?.enabled ?? false
        if (state.experimental[key].enabled !== origEnabled) {
          experimental_updates[key] = state.experimental[key]
        }
      }

      const res = await apiClient.patchClubFeatures(club.clubId, {
        ...(Object.keys(updates).length > 0              && { updates }),
        ...(Object.keys(experimental_updates).length > 0 && { experimental_updates }),
        ...(state.billing_tier   !== club.billing_tier   && { billing_tier:   state.billing_tier }),
        ...(state.billing_status !== club.billing_status && { billing_status: state.billing_status }),
        ...((state.platformFeePercent ?? 5) !== (club.platformFeePercent ?? 5) && { platformFeePercent: state.platformFeePercent }),
        feature_constraints: state.constraints,
        reasonCode: "service_matrix_edit",
      })

      if (res.success) {
        toast.success(`Saved changes for ${club.name}`)
        onSaved()
      } else {
        toast.error((res as any).message || "Save failed")
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  // ── Derived display values ───────────────────────────────────────────────

  const enabledCount  = state ? CLUB_FEATURE_KEYS.filter((k) => state.flags[k]).length : 0
  const totalCount    = CLUB_FEATURE_KEYS.length
  const initials      = club?.name?.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"
  const experimentalKeys = Object.keys(state?.experimental ?? {})

  const diffLabel = (() => {
    const parts: string[] = []
    if (diff.flagCount > 0) parts.push(`${diff.flagCount} flag${diff.flagCount > 1 ? "s" : ""}`)
    if ((diff.expCount ?? 0) > 0) parts.push(`${diff.expCount} experimental`)
    if (diff.billing)       parts.push("billing")
    if (diff.constraints)   parts.push("limits")
    if (diff.platformFee)   parts.push("platform fee")
    return parts.length > 0 ? parts.join(" · ") + " changed" : null
  })()

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Sheet open={!!club} onOpenChange={(v) => { if (!v && !saving) onClose() }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[560px] p-0 flex flex-col gap-0"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* ── Sticky header ─────────────────────────────────────────── */}
          <div className="px-5 py-4 border-b bg-background sticky top-0 z-10 shrink-0">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 select-none">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-sm font-semibold truncate leading-none">
                    {club?.name}
                  </SheetTitle>
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 shrink-0 text-muted-foreground">
                    schema v{club?.features_schema_version ?? 0}
                  </Badge>
                </div>
                <SheetDescription className="text-[11px] font-mono mt-0.5 truncate">
                  {club?.slug}
                </SheetDescription>
              </div>
              <div className="text-right shrink-0 pl-2">
                <p className="text-sm font-mono font-semibold leading-none">
                  ₹{club?.estimated_monthly_usd ?? 0}
                  <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {enabledCount}/{totalCount} on
                </p>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {!state ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="px-5 py-4 space-y-5">

                {/* ── Billing ─────────────────────────────────────────── */}
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
                    Billing
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Tier</Label>
                      <Select
                        value={state.billing_tier}
                        onValueChange={(v) => setState((s) => s ? { ...s, billing_tier: v } : s)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["free", "starter", "pro", "enterprise"].map((t) => (
                            <SelectItem
                              key={t}
                              value={t}
                              className={cn("text-xs capitalize font-medium", TIER_SELECT_COLOR[t])}
                            >
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select
                        value={state.billing_status}
                        onValueChange={(v) => setState((s) => s ? { ...s, billing_status: v } : s)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["active", "trial", "delinquent", "cancelled", "paused"].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                    <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">Platform fee (%)</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 text-xs w-24 font-mono"
                        value={state.platformFeePercent}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setState((s) => s ? { ...s, platformFeePercent: isNaN(v) ? 0 : Math.round(v * 100) / 100 } : s)
                        }}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      {(state.platformFeePercent ?? 5) !== (club?.platformFeePercent ?? 5) && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Changed
                        </span>
                      )}
                    </div>
                    {(state.platformFeePercent ?? 0) > 100 && (
                      <p className="text-xs text-red-500 mt-1">Platform fee (%) cannot be greater than 100</p>
                    )}
                  </div>
                </section>

                <div className="h-px bg-border" />

                {/* ── Feature groups ──────────────────────────────────── */}
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
                    Features
                  </p>
                  <Accordion
                    type="multiple"
                    defaultValue={FEATURE_GROUPS.map((g) => g.id)}
                    className="space-y-2"
                  >
                    {FEATURE_GROUPS.map((group) => {
                      const groupEnabled = group.keys.filter((k) => state.flags[k]).length
                      return (
                        <AccordionItem
                          key={group.id}
                          value={group.id}
                          className="border rounded-xl overflow-hidden"
                        >
                          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-muted/40 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm font-semibold">{group.label}</span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-mono px-1.5 py-0"
                              >
                                {groupEnabled}/{group.keys.length}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] px-1.5 py-0 capitalize ml-auto mr-1.5 shrink-0",
                                  group.tierColor
                                )}
                              >
                                {group.tier}+
                              </Badge>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pb-0">
                            <div className="divide-y">
                              {group.keys.map((key) => {
                                const enabled      = state.flags[key] ?? false
                                const constraintKey = FEATURE_CONSTRAINT_KEY[key]
                                return (
                                  <div
                                    key={key}
                                    className={cn(
                                      "px-3.5 py-2.5 transition-colors",
                                      enabled ? "bg-background" : "bg-muted/20"
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* State dot */}
                                      <span
                                        className={cn(
                                          "mt-1 h-2 w-2 rounded-full shrink-0 transition-colors ring-2",
                                          enabled
                                            ? "bg-emerald-500 ring-emerald-500/20"
                                            : "bg-muted-foreground/25 ring-transparent"
                                        )}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-none">
                                          {labels[key] || key}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                                          {tooltips[key]}
                                        </p>
                                        {/* Constraint input — only when feature is enabled */}
                                        {constraintKey && enabled && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <Label className="text-[10px] text-muted-foreground shrink-0">
                                              {CONSTRAINT_LABELS[constraintKey] ?? constraintKey}:
                                            </Label>
                                            <Input
                                              type="number"
                                              min={0}
                                              className="h-6 text-xs w-20 px-2 font-mono"
                                              placeholder="∞"
                                              value={
                                                state.constraints[constraintKey] !== undefined
                                                  ? state.constraints[constraintKey]
                                                  : ""
                                              }
                                              onChange={(e) =>
                                                handleConstraint(constraintKey, e.target.value)
                                              }
                                            />
                                            {(state.constraints[constraintKey] ?? 0) === 0 && (
                                              <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                0 = unlimited
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <Switch
                                        checked={enabled}
                                        className="shrink-0 data-[state=checked]:bg-emerald-500"
                                        onCheckedChange={(v) => handleToggle(key, v)}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </section>

                {/* ── Experimental flags ──────────────────────────────── */}
                {experimentalKeys.length > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <section>
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full group mb-2.5">
                          <FlaskConical className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex-1 text-left">
                            Experimental ({experimentalKeys.length})
                          </p>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1.5">
                          <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-amber-400" />
                            Experimental flags are schema-versioned and safe to add without DB migration.
                          </p>
                          {experimentalKeys.map((key) => (
                            <div
                              key={key}
                              className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/10"
                            >
                              <div>
                                <p className="text-xs font-mono font-medium">{key}</p>
                                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                                  {state.experimental[key]?.state ?? "inactive"}
                                </p>
                              </div>
                              <Switch
                                checked={state.experimental[key]?.enabled ?? false}
                                className="scale-90 data-[state=checked]:bg-amber-500"
                                onCheckedChange={(v) => handleExperimentalToggle(key, v)}
                              />
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </section>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Sticky footer ─────────────────────────────────────────── */}
          <div className="border-t bg-background px-4 sm:px-5 py-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sticky bottom-0 shrink-0">
            <p className="text-xs truncate text-center sm:text-left">
              {diffLabel ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">{diffLabel}</span>
              ) : (
                <span className="text-muted-foreground">No unsaved changes</span>
              )}
            </p>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !diff.any} className="flex-1 sm:flex-none">
                {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <DependencyWarningDialog
        open={depConflicts.length > 0}
        onClose={() => setDepConflicts([])}
        conflicts={depConflicts}
        clubName={club?.name ?? ""}
      />
    </>
  )
}
