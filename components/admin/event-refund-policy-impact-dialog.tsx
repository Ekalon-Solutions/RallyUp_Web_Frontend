"use client"

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
import { AlertTriangle } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  changingToNonRefundable: boolean
  loading?: boolean
}

export function EventRefundPolicyImpactDialog({
  open,
  onOpenChange,
  onConfirm,
  changingToNonRefundable,
  loading = false,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Warning: This will impact existing ticket holders
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left flex flex-col gap-2">
            <span>
              This event is live and already has confirmed registrations. Changing the refund policy
              will affect how members see cancellation options in the app.
            </span>
            {changingToNonRefundable ? (
              <span>
                Members who purchased while refunds were allowed may still qualify under your
                club&apos;s grandfathering setting. A policy change timestamp will be recorded for
                audit purposes.
              </span>
            ) : (
              <span>
                Enabling refunds will show the Cancel/Refund action to members who are still within
                the cancellation window.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Saving…" : "Confirm policy change"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
