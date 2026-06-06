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
import { ArrowRight, Loader2 } from "lucide-react"
import type { ClubFeatureKey } from "@/lib/clubFeatures"

export type PendingChange = {
  key: ClubFeatureKey
  label: string
  from: boolean
  to: boolean
}

type Props = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
  clubName: string
  changes: PendingChange[]
  billingImpact?: {
    current_monthly_usd: number
    new_monthly_usd: number
    prorated_this_month_usd: number
  }
}

export function SaveConfirmDialog({ open, onConfirm, onCancel, saving, clubName, changes, billingImpact }: Props) {
  const enabling = changes.filter((c) => c.to)
  const disabling = changes.filter((c) => !c.to)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm feature changes</DialogTitle>
          <DialogDescription>
            You are about to update{" "}
            <strong>{changes.length} {changes.length === 1 ? "module" : "modules"}</strong> for{" "}
            <strong>{clubName}</strong>. Changes sync immediately to connected sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 max-h-60 overflow-y-auto">
          {enabling.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                Enabling
              </p>
              {enabling.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 mb-1"
                >
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="text-muted-foreground flex-1 truncate">{c.label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
          {disabling.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-1.5">Disabling</p>
              {disabling.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md bg-red-50 dark:bg-red-950/20 mb-1"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-muted-foreground flex-1 truncate">{c.label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {billingImpact && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wide">
              Billing Impact
            </p>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Current monthly</span>
              <span className="font-mono">${billingImpact.current_monthly_usd.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-medium text-foreground">
              <span>New monthly</span>
              <span className="font-mono">${billingImpact.new_monthly_usd.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-amber-200 dark:border-amber-800 pt-1 mt-1">
              <span>Prorated charge this month</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                ${billingImpact.prorated_this_month_usd.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
