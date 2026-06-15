"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Users, Layers, ToggleRight, Target } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { CLUB_FEATURE_KEYS } from "@/lib/clubFeatures"
import type { ClubFeatureKey } from "@/lib/clubFeatures"

type Props = {
  selectedIds: string[]
  labels: Record<string, string>
  bulkTier: string
  setBulkTier: (t: string) => void
  onApplied: () => void
  onClearSelection: () => void
  onOpenCohortDialog: () => void
}

export function BulkFeaturePanel({
  selectedIds,
  labels,
  bulkTier,
  setBulkTier,
  onApplied,
  onClearSelection,
  onOpenCohortDialog,
}: Props) {
  const [featureKey,    setFeatureKey]    = useState<ClubFeatureKey | "">("")
  const [featureAction, setFeatureAction] = useState<"enable" | "disable">("enable")
  const [applyingTier,    setApplyingTier]    = useState(false)
  const [applyingFeature, setApplyingFeature] = useState(false)

  const applyBulkTier = async () => {
    setApplyingTier(true)
    try {
      const res = await apiClient.bulkApplyClubBillingTier(selectedIds, bulkTier, "bulk_matrix")
      if (res.success) {
        toast.success(
          `Applied ${bulkTier} tier to ${res.data?.updated ?? selectedIds.length} clubs`
        )
        onApplied()
      } else {
        toast.error((res as any).message || "Bulk tier update failed")
      }
    } catch {
      toast.error("Bulk tier update failed")
    } finally {
      setApplyingTier(false)
    }
  }

  const applyBulkFeature = async () => {
    if (!featureKey) { toast.error("Select a feature"); return }
    setApplyingFeature(true)
    const targetEnabled = featureAction === "enable"
    try {
      const results = await Promise.allSettled(
        selectedIds.map((clubId) =>
          apiClient.patchClubFeatures(clubId, {
            updates: { [featureKey]: { enabled: targetEnabled } },
            reasonCode: "bulk_feature_matrix",
          })
        )
      )
      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value?.success
      ).length
      const failed = results.length - succeeded
      if (succeeded > 0) {
        toast.success(
          `${targetEnabled ? "Enabled" : "Disabled"} ${labels[featureKey] || featureKey} for ${succeeded} ${succeeded === 1 ? "club" : "clubs"}`
        )
      }
      if (failed > 0) toast.error(`Failed for ${failed} ${failed === 1 ? "club" : "clubs"}`)
      onApplied()
    } catch {
      toast.error("Bulk feature update failed")
    } finally {
      setApplyingFeature(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="px-4 py-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Bulk actions</span>
          <Badge variant="secondary" className="text-xs font-mono px-2">
            {selectedIds.length} selected
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 flex-1 sm:flex-none"
            onClick={onOpenCohortDialog}
          >
            <Target className="h-3 w-3" />
            Target cohort
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full shrink-0"
            onClick={onClearSelection}
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-3">

        {/* ── Billing tier ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 w-full sm:w-auto">
          <div className="space-y-1.5 flex-1 sm:flex-none">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Layers className="h-2.5 w-2.5" /> Tier
            </p>
            <Select value={bulkTier} onValueChange={setBulkTier}>
              <SelectTrigger className="h-8 w-full sm:w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["free", "starter", "pro", "enterprise"].map((t) => (
                  <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs w-full sm:w-auto"
            disabled={applyingTier}
            onClick={applyBulkTier}
          >
            {applyingTier ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : null}
            Apply tier
          </Button>
        </div>

        <div className="w-px self-stretch bg-border hidden sm:block" />

        {/* ── Feature toggle ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 w-full sm:w-auto">
          <div className="space-y-1.5 flex-1 sm:flex-none">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <ToggleRight className="h-2.5 w-2.5" /> Feature
            </p>
            <Select
              value={featureKey}
              onValueChange={(v) => setFeatureKey(v as ClubFeatureKey)}
            >
              <SelectTrigger className="h-8 w-full sm:w-[190px] text-xs">
                <SelectValue placeholder="Select feature…" />
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
          <div className="space-y-1.5 flex-1 sm:flex-none">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Action</p>
            <Select
              value={featureAction}
              onValueChange={(v) => setFeatureAction(v as "enable" | "disable")}
            >
              <SelectTrigger className="h-8 w-full sm:w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enable"  className="text-xs">Enable</SelectItem>
                <SelectItem value="disable" className="text-xs">Disable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs w-full sm:w-auto"
            disabled={applyingFeature || !featureKey}
            onClick={applyBulkFeature}
          >
            {applyingFeature ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : null}
            Apply
          </Button>
        </div>

      </div>
    </div>
  )
}
