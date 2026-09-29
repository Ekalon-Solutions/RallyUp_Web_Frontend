"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"

export type CancelMode = "cancel" | "cancel_refund"

/** Which admin action the dialog is confirming. */
export type EventCancelIntent =
  | { kind: "cancel"; mode: CancelMode }
  | { kind: "refund_all" }
  | { kind: "delete" }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  intent: EventCancelIntent | null
  loading?: boolean
  onConfirm: (result: { mode?: CancelMode; reason?: string }) => void
}

export function EventCancelDialog({ open, onOpenChange, eventTitle, intent, loading = false, onConfirm }: Props) {
  const [mode, setMode] = useState<CancelMode>("cancel")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (!open) return
    setMode(intent?.kind === "cancel" ? intent.mode : "cancel")
    setReason("")
  }, [open, intent])

  if (!intent) return null

  const isCancel = intent.kind === "cancel"
  const feeNote = "Platform and gateway fees are charged to the club, not deducted from ticket holders."
  const copy = {
    cancel: {
      title: `Cancel "${eventTitle}"?`,
      body: "Every unscanned ticket is cancelled and holders are notified. Tickets already checked in are left as they are. This cannot be undone.",
      cta: mode === "cancel_refund" ? "Cancel event & refund" : "Cancel event",
    },
    refund_all: {
      title: `Refund every ticket for "${eventTitle}"?`,
      body: `Every unrefunded, unscanned ticket is refunded in full to the original payment method. ${feeNote}`,
      cta: "Refund all tickets",
    },
    delete: {
      title: `Delete "${eventTitle}"?`,
      body: "The event is permanently removed. Events with purchased tickets cannot be deleted — cancel them instead.",
      cta: "Delete event",
    },
  }[intent.kind]

  return (
    <AlertDialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {copy.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">{copy.body}</AlertDialogDescription>
        </AlertDialogHeader>

        {isCancel && (
          <div className="flex flex-col gap-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as CancelMode)} className="gap-3">
              <label htmlFor="cancel-mode-only" className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem id="cancel-mode-only" value="cancel" className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Cancel only</span>
                  <span className="text-xs text-muted-foreground">
                    Tickets are cancelled now. You can refund them later from “Process Refund for All Tickets”.
                  </span>
                </span>
              </label>
              <label htmlFor="cancel-mode-refund" className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem id="cancel-mode-refund" value="cancel_refund" className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Cancel and refund all tickets</span>
                  <span className="text-xs text-muted-foreground">Full refunds are issued immediately. {feeNote}</span>
                </span>
              </label>
            </RadioGroup>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cancel-reason">Reason (optional, shown in audit log)</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Venue unavailable due to weather"
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep event</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => onConfirm(isCancel ? { mode, reason: reason.trim() || undefined } : {})}
          >
            {loading ? "Working…" : copy.cta}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
