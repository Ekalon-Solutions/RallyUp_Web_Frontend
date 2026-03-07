'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface RecalculatedRefund {
  recalculatedRefund: number
  percentage: number
  differs: boolean
}

interface RefundRequest {
  _id: string
  sourceType: 'event_ticket' | 'store_order'
  user: {
    first_name: string
    last_name: string
    email: string
    phoneNumber: string
  }
  eventId?: {
    title: string
    startTime: string
    venue?: string
  }
  orderId?: {
    orderNumber: string
    total: number
  }
  currency: string
  estimatedRefund: number
  breakdown: {
    grossPaid: number
    taxesExcluded: number
    platformFeesExcluded: number
    paymentGatewayFeesExcluded: number
  }
  status: 'requested' | 'processed' | 'rejected'
  requestedAt: string
  processedAt?: string
  adminNotes?: string
}

interface RefundDetailsModalProps {
  refund: RefundRequest | null
  recalculated?: RecalculatedRefund | null
  onClose: () => void
  onMarkProcessed: (refundId: string, adminNotes: string) => Promise<void>
}

export function RefundDetailsModal({ refund, recalculated, onClose, onMarkProcessed }: RefundDetailsModalProps) {
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  if (!refund) return null

  const handleSubmit = async () => {
    setProcessing(true)
    try {
      await onMarkProcessed(refund._id, adminNotes)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refund Request Details</DialogTitle>
          <DialogDescription>
            Review and process refund request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">User</Label>
              <p className="text-sm">{refund.user.first_name} {refund.user.last_name}</p>
              <p className="text-xs text-muted-foreground">{refund.user.email}</p>
              <p className="text-xs text-muted-foreground">{refund.user.phoneNumber}</p>
            </div>

            <div>
              <Label className="font-semibold">Type</Label>
              <p className="text-sm capitalize">
                {refund.sourceType === 'event_ticket' ? 'Event Ticket' : 'Store Order'}
              </p>
              
              {refund.sourceType === 'event_ticket' && refund.eventId && (
                <>
                  <Label className="font-semibold mt-2">Event</Label>
                  <p className="text-sm font-medium">{refund.eventId.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(refund.eventId.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {refund.eventId.venue && (
                    <p className="text-xs text-muted-foreground">{refund.eventId.venue}</p>
                  )}
                </>
              )}
              
              {refund.sourceType === 'store_order' && refund.orderId && (
                <>
                  <Label className="font-semibold mt-2">Order</Label>
                  <p className="text-sm">#{refund.orderId.orderNumber}</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Refund Breakdown</h3>
            
            <div className="flex justify-between text-sm">
              <span>Gross Paid:</span>
              <span>{refund.currency} {refund.breakdown.grossPaid.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-destructive">
              <span>Platform Fees (excluded):</span>
              <span>- {refund.currency} {refund.breakdown.platformFeesExcluded.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-destructive">
              <span>Payment Gateway Fees (excluded):</span>
              <span>- {refund.currency} {refund.breakdown.paymentGatewayFeesExcluded.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-destructive">
              <span>Taxes (excluded):</span>
              <span>- {refund.currency} {refund.breakdown.taxesExcluded.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between pt-3 border-t-2 border-border">
              <span className="font-bold">Estimated Refund:</span>
              <span className="font-bold text-green-600 dark:text-green-500">
                {refund.currency} {refund.estimatedRefund.toFixed(2)}
              </span>
            </div>
            {recalculated?.differs && refund.status === 'requested' && (
              <Alert className="mt-3 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Per current refund rules:</span>{' '}
                  <span className="font-bold text-green-600 dark:text-green-500">
                    {refund.currency} {recalculated.recalculatedRefund.toFixed(2)}
                  </span>
                  {' '}({recalculated.percentage}% applies). This amount will be used when you mark as processed.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <Label className="font-semibold">Status</Label>
              <p className="text-sm">{refund.status === 'processed' ? 'Refund Processed' : refund.status}</p>
            </div>
            
            <div>
              <Label className="font-semibold">Requested At</Label>
              <p className="text-sm">{new Date(refund.requestedAt).toLocaleString()}</p>
            </div>
            
            {refund.processedAt && (
              <div>
                <Label className="font-semibold">Processed At</Label>
                <p className="text-sm">{new Date(refund.processedAt).toLocaleString()}</p>
              </div>
            )}
            
            {refund.adminNotes && (
              <div>
                <Label className="font-semibold">Admin Notes</Label>
                <p className="text-sm">{refund.adminNotes}</p>
              </div>
            )}
          </div>

          {refund.status === 'requested' && (
            <div className="space-y-2">
              <Label htmlFor="adminNotes" className="font-semibold">
                Admin Notes
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about the refund processing..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          
          {refund.status === 'requested' && (
            <Button
              onClick={handleSubmit}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Processing...' : 'Mark as Processed'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
