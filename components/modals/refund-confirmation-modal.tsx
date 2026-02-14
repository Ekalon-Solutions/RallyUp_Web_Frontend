'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface RefundEstimate {
  eligible: boolean
  cutoff: string | null
  estimatedRefund: number
  currency: string
  breakdown: {
    grossPaid: number
    taxesExcluded: number
    platformFeesExcluded: number
    paymentGatewayFeesExcluded: number
  }
}

interface RefundConfirmationModalProps {
  estimate: RefundEstimate
  sourceType: 'event_ticket' | 'store_order'
  loading: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function RefundConfirmationModal({
  estimate,
  sourceType,
  loading,
  error,
  onConfirm,
  onCancel
}: RefundConfirmationModalProps) {
  const { estimatedRefund, currency, breakdown } = estimate

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Refund Request</DialogTitle>
          <DialogDescription>
            Review the refund breakdown before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Amount Paid:</span>
              <span className="font-semibold">
                {currency} {breakdown.grossPaid.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-destructive">
              <span>Platform Fees (excluded):</span>
              <span>- {currency} {breakdown.platformFeesExcluded.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-destructive">
              <span>Payment Gateway Fees (excluded):</span>
              <span>- {currency} {breakdown.paymentGatewayFeesExcluded.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-destructive">
              <span>Taxes (excluded):</span>
              <span>- {currency} {breakdown.taxesExcluded.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-3 border-t-2 border-border">
              <span className="font-bold">Estimated Refund:</span>
              <span className="font-bold text-green-600 dark:text-green-500">
                {currency} {estimatedRefund.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
                <p>
                  {sourceType === 'event_ticket'
                    ? 'Your ticket will be cancelled and the refund will be processed in 5-7 working days excluding the platform fees, payment gateway fees and taxes.'
                    : 'Your order will be cancelled and the refund will be processed in 5-7 working days excluding the platform fees, payment gateway fees and taxes.'}
                </p>
                <p className="text-xs">
                  Please refer to the refund policy for more details.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onCancel} disabled={loading} variant="outline">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} variant="destructive">
            {loading ? 'Processing...' : 'Confirm Refund Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
