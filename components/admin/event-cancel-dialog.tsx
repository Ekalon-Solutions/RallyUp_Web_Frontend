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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"

export type CancelMode = "cancel" | "cancel_refund"
export type RefundBasis = "policy" | "full"

/** Which admin action the dialog is confirming. */
export type EventCancelIntent =
  | { kind: "cancel"; mode: CancelMode }
  | { kind: "refund_all" }
  | { kind: "delete" }

export type CancelDialogVenue = { _id: string; name: string; cancelledAt?: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  /** Multi-venue events get a venue picker; single-venue events cancel the whole event. */
  venues?: CancelDialogVenue[]
  intent: EventCancelIntent | null
  loading?: boolean
  onConfirm: (result: { mode?: CancelMode; reason?: string; venueIds?: string[]; refundBasis?: RefundBasis }) => void
}

export function EventCancelDialog({ open, onOpenChange, eventTitle, venues = [], intent, loading = false, onConfirm }: Props) {
  const [mode, setMode] = useState<CancelMode>("cancel")
  const [reason, setReason] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [entireEvent, setEntireEvent] = useState(false)
  const [fullRefund, setFullRefund] = useState(false)

  const multiVenue = venues.length > 1

  useEffect(() => {
    if (!open) return
    setMode(intent?.kind === "cancel" ? intent.mode : "cancel")
    setReason("")
    setSelected([])
    setEntireEvent(false)
    setFullRefund(false)
  }, [open, intent])

  if (!intent) return null

  const isCancel = intent.kind === "cancel"
  const toggle = (id: string, on: boolean) => setSelected((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)))
  // Multi-venue: only the ticked venues are cancelled unless the admin explicitly picks the entire event.
  const wholeEvent = !multiVenue || entireEvent
  const nothingSelected = isCancel && multiVenue && !entireEvent && selected.length === 0
  const feeNote = "Platform and gateway fees are charged to the club, not deducted from ticket holders."
  const refundsOn = (isCancel && mode === "cancel_refund") || intent.kind === "refund_all"
  const copy = {
    cancel: {
      title: wholeEvent ? `Cancel "${eventTitle}"?` : `Cancel ${selected.length === 1 ? "this venue" : `${selected.length} venues`} for "${eventTitle}"?`,
      body: wholeEvent
        ? "Every unscanned ticket is cancelled and holders are notified. Tickets already checked in are left as they are. This cannot be undone."
        : "Only tickets for the selected venues are cancelled and their holders notified. The event stays live for the other venues. This cannot be undone.",
      cta: `${wholeEvent ? "Cancel event" : "Cancel venue"}${mode === "cancel_refund" ? " & refund" : ""}`,
    },
    refund_all: {
      title: `Refund every ticket for "${eventTitle}"?`,
      body: "Every unrefunded, unscanned ticket is refunded to the original payment method — per the club's refund policy, or in full if you choose below.",
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
            {multiVenue && (
              <div className="flex flex-col gap-1.5">
                <Label>What to cancel</Label>
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  {venues.map((v) => {
                    const done = Boolean(v.cancelledAt)
                    return (
                      <label key={v._id} className={`flex items-center gap-2 text-sm ${done || entireEvent ? "text-muted-foreground" : "cursor-pointer"}`}>
                        <Checkbox
                          checked={done || selected.includes(v._id)}
                          disabled={done || entireEvent}
                          onCheckedChange={(c) => toggle(v._id, c === true)}
                        />
                        <span>{v.name}</span>
                        {done && <span className="text-xs">(already cancelled)</span>}
                      </label>
                    )
                  })}
                  <label className="mt-1 flex items-center gap-2 border-t pt-2 text-sm font-medium cursor-pointer">
                    <Checkbox checked={entireEvent} onCheckedChange={(c) => setEntireEvent(c === true)} />
                    <span>Entire event (all venues)</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {entireEvent
                    ? "The event is marked cancelled and every unscanned ticket is cancelled."
                    : "Only tickets for the ticked venues are cancelled. The event stays live and unticked venues keep taking bookings."}
                </p>
              </div>
            )}
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
                  <span className="text-xs text-muted-foreground">Refunds are issued immediately per the club's refund policy at this point in time.</span>
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

        {refundsOn && (
          <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
            <Checkbox className="mt-0.5" checked={fullRefund} onCheckedChange={(c) => setFullRefund(c === true)} />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Refund in full, ignoring the refund policy</span>
              <span className="text-xs text-muted-foreground">Holders get back everything they paid. {feeNote}</span>
            </span>
          </label>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep event</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={loading || nothingSelected}
            onClick={() =>
              onConfirm({
                ...(isCancel ? { mode, reason: reason.trim() || undefined, venueIds: multiVenue && !wholeEvent ? selected : undefined } : {}),
                ...(refundsOn ? { refundBasis: fullRefund ? "full" : "policy" } : {}),
              })
            }
          >
            {loading ? "Working…" : copy.cta}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
