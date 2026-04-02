"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HardDrive, AlertTriangle, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface SubscriptionCancelledModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  overageGb: number
  usedGb: number
  baseAllocationGb: number
}

export function SubscriptionCancelledModal({
  open,
  onOpenChange,
  overageGb,
  usedGb,
  baseAllocationGb,
}: SubscriptionCancelledModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg font-bold leading-tight">
              Storage Subscription Ended
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Your paid storage plan has been cancelled or has expired.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4">
            <div className="flex items-start gap-3">
              <HardDrive className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Storage overage: {overageGb.toFixed(2)} GB
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  You are using <strong>{usedGb.toFixed(2)} GB</strong> but your base allocation is only{" "}
                  <strong>{baseAllocationGb.toFixed(2)} GB</strong>. You are{" "}
                  <strong>{overageGb.toFixed(2)} GB</strong> over the limit.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            To continue uploading media and avoid potential data restrictions, please purchase a storage upgrade plan or
            delete unused media to bring usage within your base allocation.
          </p>

          <div className="flex flex-col gap-2">
            <Link href="/dashboard/gallery" onClick={() => onOpenChange(false)} className="w-full">
              <Button className="w-full gap-2" size="sm">
                <ShoppingCart className="h-4 w-4" />
                Purchase Storage Plan
              </Button>
            </Link>
            <Link href="/dashboard/gallery" onClick={() => onOpenChange(false)} className="w-full">
              <Button variant="outline" className="w-full" size="sm">
                Manage &amp; Delete Media
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Remind Me Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
