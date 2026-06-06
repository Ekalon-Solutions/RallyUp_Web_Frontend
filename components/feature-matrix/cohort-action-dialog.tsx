"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  FlaskConical,
  Zap,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CLUB_FEATURE_KEYS } from "@/lib/clubFeatures"
import type { ClubFeatureKey } from "@/lib/clubFeatures"
import { apiClient } from "@/lib/api"
import type { MatrixClub } from "./matrix-table"

// ── Types ────────────────────────────────────────────────────────────────────

type FeatureType  = "standard" | "experimental"
type ToggleAction = "enable" | "disable"

type CohortFilter = {
  tier:   string   // "all" | "free" | "starter" | "pro" | "enterprise"
  status: string   // "all" | "active" | "trial" | "delinquent" | ...
}

type ApplyProgress = {
  total:     number
  done:      number
  succeeded: number
  failed:    number
  errors:    string[]   // club names that failed
}

type Step = "configure" | "preview" | "applying" | "done"

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  free: "Free", starter: "Starter", pro: "Pro", enterprise: "Enterprise",
}

const TIERS   = ["free", "starter", "pro", "enterprise"] as const
const STATUSES = ["active", "trial", "delinquent", "cancelled", "paused"] as const

function matchesCohort(club: MatrixClub, filter: CohortFilter): boolean {
  if (filter.tier   !== "all" && club.billing_tier   !== filter.tier)   return false
  if (filter.status !== "all" && club.billing_status !== filter.status) return false
  return true
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open:     boolean
  onClose:  () => void
  onApplied: () => void
  /** Full, unfiltered club list from the API — cohort matching runs over ALL clubs */
  allClubs: MatrixClub[]
  labels:   Record<string, string>
}

// ── Component ────────────────────────────────────────────────────────────────

export function CohortActionDialog({ open, onClose, onApplied, allClubs, labels }: Props) {
  // Step state
  const [step, setStep] = useState<Step>("configure")

  // Cohort filter
  const [cohort, setCohort] = useState<CohortFilter>({ tier: "all", status: "all" })

  // Feature action
  const [featureType,    setFeatureType]    = useState<FeatureType>("experimental")
  const [standardKey,    setStandardKey]    = useState<ClubFeatureKey | "">("")
  const [experimentalKey, setExperimentalKey] = useState("")
  const [action, setAction] = useState<ToggleAction>("enable")

  // Progress tracking during apply
  const [progress, setProgress] = useState<ApplyProgress | null>(null)

  // ── Derived data ────────────────────────────────────────────────────────

  const targetClubs = useMemo(
    () => allClubs.filter((c) => matchesCohort(c, cohort)),
    [allClubs, cohort]
  )

  const resolvedKey: string =
    featureType === "standard" ? standardKey : experimentalKey.trim()

  const canProceed =
    targetClubs.length > 0 &&
    resolvedKey.length > 0 &&
    (featureType === "standard" ? CLUB_FEATURE_KEYS.includes(resolvedKey as ClubFeatureKey) : resolvedKey.length >= 2)

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleApply = async () => {
    if (!canProceed) return
    setStep("applying")
    const init: ApplyProgress = { total: targetClubs.length, done: 0, succeeded: 0, failed: 0, errors: [] }
    setProgress(init)

    let succeeded = 0
    let failed    = 0
    const errors: string[] = []

    for (const club of targetClubs) {
      try {
        const body =
          featureType === "standard"
            ? {
                updates: { [resolvedKey]: { enabled: action === "enable" } },
                reasonCode: "cohort_bulk_toggle",
              }
            : {
                experimental_updates: { [resolvedKey]: { enabled: action === "enable", state: action === "enable" ? "active" : "inactive" } },
                reasonCode: "cohort_bulk_experimental",
              }

        const res = await apiClient.patchClubFeatures(club.clubId, body)
        if (res.success) {
          succeeded++
        } else {
          failed++
          errors.push(club.name)
        }
      } catch {
        failed++
        errors.push(club.name)
      }

      setProgress({
        total:     targetClubs.length,
        done:      succeeded + failed,
        succeeded,
        failed,
        errors,
      })
    }

    if (succeeded > 0) {
      toast.success(
        `${action === "enable" ? "Enabled" : "Disabled"} "${resolvedKey}" for ${succeeded} club${succeeded !== 1 ? "s" : ""}`
      )
    }
    if (failed > 0) {
      toast.error(`Failed for ${failed} club${failed !== 1 ? "s" : ""}`)
    }

    setStep("done")
    onApplied()
  }

  const handleClose = () => {
    if (step === "applying") return   // block close while in-flight
    // Reset state
    setStep("configure")
    setCohort({ tier: "all", status: "all" })
    setFeatureType("experimental")
    setStandardKey("")
    setExperimentalKey("")
    setAction("enable")
    setProgress(null)
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Bulk Toggle — Target a Cohort
          </DialogTitle>
          <DialogDescription>
            Enable or disable a feature for every club that matches the cohort you define.
            Changes are applied one club at a time and can be undone individually.
          </DialogDescription>
        </DialogHeader>

        {/* ── CONFIGURE step ───────────────────────────────────────────── */}
        {(step === "configure" || step === "preview") && (
          <div className="space-y-5 py-1">

            {/* Cohort definition */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                <p className="text-sm font-semibold">Define cohort</p>
                {targetClubs.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs font-mono">
                    {targetClubs.length} club{targetClubs.length !== 1 ? "s" : ""} match
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Billing tier</Label>
                  <Select value={cohort.tier} onValueChange={(v) => setCohort((c) => ({ ...c, tier: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All tiers</SelectItem>
                      {TIERS.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs capitalize">{TIER_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Billing status</Label>
                  <Select value={cohort.status} onValueChange={(v) => setCohort((c) => ({ ...c, status: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All statuses</SelectItem>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Zero-match warning */}
              {targetClubs.length === 0 && (
                <p className="pl-7 text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  No clubs match these filters
                </p>
              )}
            </section>

            <div className="h-px bg-border" />

            {/* Feature action */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <p className="text-sm font-semibold">Choose feature &amp; action</p>
              </div>
              <div className="pl-7 space-y-3">
                {/* Feature type toggle */}
                <div className="flex rounded-lg border overflow-hidden text-xs">
                  {(["standard", "experimental"] as FeatureType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFeatureType(t)}
                      className={cn(
                        "flex-1 py-1.5 flex items-center justify-center gap-1.5 font-medium transition-colors",
                        featureType === t
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {t === "experimental"
                        ? <FlaskConical className="h-3 w-3" />
                        : <Zap className="h-3 w-3" />}
                      {t === "standard" ? "Standard feature" : "Experimental flag"}
                    </button>
                  ))}
                </div>

                {featureType === "standard" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Feature</Label>
                    <Select
                      value={standardKey}
                      onValueChange={(v) => setStandardKey(v as ClubFeatureKey)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a feature…" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLUB_FEATURE_KEYS.map((k) => (
                          <SelectItem key={k} value={k} className="text-xs">
                            {labels[k] || k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Experimental flag key
                      <span className="ml-1 text-muted-foreground/60">(can be a new key not yet in any document)</span>
                    </Label>
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="e.g. ai_assistant, advanced_analytics…"
                      value={experimentalKey}
                      onChange={(e) => setExperimentalKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    />
                    {experimentalKey.length > 0 && experimentalKey.length < 2 && (
                      <p className="text-[10px] text-destructive">Key must be at least 2 characters</p>
                    )}
                  </div>
                )}

                {/* Action */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <div className="flex rounded-lg border overflow-hidden text-xs">
                    {(["enable", "disable"] as ToggleAction[]).map((a) => (
                      <button
                        key={a}
                        onClick={() => setAction(a)}
                        className={cn(
                          "flex-1 py-1.5 font-medium capitalize transition-colors",
                          action === a
                            ? a === "enable"
                              ? "bg-emerald-500 text-white"
                              : "bg-destructive text-destructive-foreground"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Preview club list */}
            {step === "preview" && targetClubs.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                    <p className="text-sm font-semibold">Affected clubs</p>
                  </div>
                  <ScrollArea className="h-[140px] rounded-lg border pl-7">
                    <div className="py-1.5 pr-3 space-y-0.5">
                      {targetClubs.map((c) => (
                        <div key={c.clubId} className="flex items-center gap-2 py-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                          <span className="font-medium truncate flex-1">{c.name}</span>
                          <span className="text-muted-foreground capitalize shrink-0">{c.billing_tier}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </section>
              </>
            )}
          </div>
        )}

        {/* ── APPLYING step ────────────────────────────────────────────── */}
        {step === "applying" && progress && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">
                {action === "enable" ? "Enabling" : "Disabling"}{" "}
                <span className="font-mono text-primary">"{resolvedKey}"</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {progress.done} of {progress.total} clubs processed…
              </p>
            </div>
            <Progress value={(progress.done / progress.total) * 100} className="h-2" />
            <div className="flex items-center justify-center gap-6 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {progress.succeeded} succeeded
              </span>
              {progress.failed > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  {progress.failed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── DONE step ────────────────────────────────────────────────── */}
        {step === "done" && progress && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              {progress.failed === 0 ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              )}
              <p className="text-sm font-semibold">
                {progress.succeeded > 0
                  ? `${progress.succeeded} club${progress.succeeded !== 1 ? "s" : ""} updated`
                  : "No clubs updated"}
              </p>
              {progress.failed > 0 && (
                <p className="text-xs text-destructive">
                  {progress.failed} failed: {progress.errors.slice(0, 3).join(", ")}
                  {progress.errors.length > 3 && ` +${progress.errors.length - 3} more`}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Feature</span>
                <span>{resolvedKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action</span>
                <span className="capitalize">{action}d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cohort</span>
                <span>
                  {cohort.tier === "all" ? "all tiers" : cohort.tier}
                  {cohort.status !== "all" ? ` · ${cohort.status}` : ""}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Result</span>
                <span className="text-emerald-600">{progress.succeeded}/{progress.total} ok</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <DialogFooter className="gap-2">
          {step === "done" ? (
            <Button onClick={handleClose}>Close</Button>
          ) : step === "applying" ? (
            <Button disabled>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Applying…
            </Button>
          ) : step === "preview" ? (
            <>
              <Button variant="outline" onClick={() => setStep("configure")}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={!canProceed}>
                {action === "enable" ? "Enable" : "Disable"} for {targetClubs.length} club{targetClubs.length !== 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!canProceed}
                className="gap-1.5"
              >
                Preview
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
