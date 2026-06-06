"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { ClubFeatureKey } from "@/lib/clubFeatures"

export type DependencyConflict = {
  featureBeingDisabled: ClubFeatureKey
  disabledLabel: string
  dependents: Array<{ key: ClubFeatureKey; label: string }>
}

type Props = {
  open: boolean
  onClose: () => void
  conflicts: DependencyConflict[]
  clubName: string
}

export function DependencyWarningDialog({ open, onClose, conflicts, clubName }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            Feature Dependency Conflict
          </DialogTitle>
          <DialogDescription>
            This change cannot be applied to <strong>{clubName}</strong> because of active
            module dependencies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {conflicts.map((c) => (
            <div
              key={c.featureBeingDisabled}
              className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-sm"
            >
              <p className="font-semibold text-amber-800 dark:text-amber-400">
                {c.disabledLabel}
              </p>
              <p className="text-muted-foreground mt-1">
                Cannot be disabled while the following{" "}
                {c.dependents.length === 1 ? "module is" : "modules are"} active:{" "}
                <span className="font-medium text-foreground">
                  {c.dependents.map((d) => d.label).join(", ")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Disable{" "}
                <span className="font-medium">{c.dependents.map((d) => d.label).join(", ")}</span>{" "}
                first, then retry.
              </p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Understood</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
