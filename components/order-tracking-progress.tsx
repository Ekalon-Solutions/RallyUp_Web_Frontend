"use client"

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Package,
  PackageCheck,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  RotateCcw,
  AlertTriangle,
  Star,
  Loader2,
  Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TrackingEvent {
  timestamp: string
  status: string
  activity: string
  location: string
  srStatusCode?: string
}

export interface TrackableOrder {
  _id: string
  orderNumber: string
  status: string
  paymentStatus: string
  deliveryStatus?: 'in_transit' | 'out_for_delivery' | 'delivered' | 'rto_initiated' | 'rto_delivered' | 'damaged' | 'lost'
  awbCode?: string
  courierName?: string
  shiprocketStatus?: 'pending' | 'pushed' | 'failed'
  estimatedDeliveryDate?: string
  actualDeliveryAt?: string
  isRTO?: boolean
  isDamaged?: boolean
  isLost?: boolean
  trackingEvents?: TrackingEvent[]
  customerConfirmedDeliveryAt?: string
  rating?: number
  ratingFeedback?: string
}

interface OrderTrackingProgressProps {
  order: TrackableOrder
  onOrderUpdate?: (updatedOrder: TrackableOrder) => void
}

const STAGES = [
  { label: 'Order Placed', icon: Package },
  { label: 'Ready to Ship', icon: PackageCheck },
  { label: 'In Transit', icon: Truck },
  { label: 'Delivered', icon: CheckCircle2 },
] as const

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function getCurrentStep(order: TrackableOrder): number {
  let step = 1

  const readyToShip =
    !!order.awbCode ||
    !!order.deliveryStatus ||
    order.shiprocketStatus === 'pushed' ||
    ['ready_to_ship', 'fulfillment_in_progress', 'shipped'].includes(order.status)

  if (readyToShip) step = 2
  if (order.deliveryStatus === 'in_transit' || order.deliveryStatus === 'out_for_delivery') step = 3
  if (order.deliveryStatus === 'delivered') step = 4

  return step
}

function formatDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function OrderTrackingProgress({ order, onOrderUpdate }: OrderTrackingProgressProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const isPreDispatch =
    order.paymentStatus === 'paid' &&
    order.status !== 'cancelled' &&
    !order.awbCode &&
    !order.deliveryStatus &&
    order.shiprocketStatus !== 'pushed'

  const hasIssue =
    order.isRTO ||
    order.isDamaged ||
    order.isLost ||
    order.deliveryStatus === 'rto_initiated' ||
    order.deliveryStatus === 'rto_delivered' ||
    order.deliveryStatus === 'damaged' ||
    order.deliveryStatus === 'lost'

  const isDelivered = order.deliveryStatus === 'delivered'

  const showPostDelivery =
    isDelivered &&
    !!order.actualDeliveryAt &&
    Date.now() - new Date(order.actualDeliveryAt).getTime() >= TWENTY_FOUR_HOURS_MS

  const lastEvent = order.trackingEvents?.length
    ? order.trackingEvents[order.trackingEvents.length - 1]
    : undefined

  const handleCopyAwb = async () => {
    if (!order.awbCode) return
    try {
      await navigator.clipboard.writeText(order.awbCode)
      setCopied(true)
      toast({ title: 'Copied', description: 'AWB number copied to clipboard.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Could not copy', description: 'Please copy the AWB number manually.', variant: 'destructive' })
    }
  }

  const handleTrackOnShiprocket = () => {
    if (!order.awbCode) return
    window.open(`https://shiprocket.co/tracking/${order.awbCode}`, '_blank', 'noopener,noreferrer')
  }

  const handleConfirmReceipt = async () => {
    setConfirming(true)
    try {
      const res = await apiClient.confirmOrderReceipt(order._id)
      if (res.success) {
        toast({ title: 'Thanks!', description: 'Receipt confirmed.' })
        onOrderUpdate?.({
          ...order,
          ...(res.data || {}),
          customerConfirmedDeliveryAt: res.data?.customerConfirmedDeliveryAt || new Date().toISOString(),
        })
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to confirm receipt', variant: 'destructive' })
      }
    } finally {
      setConfirming(false)
    }
  }

  const handleSubmitRating = async () => {
    if (ratingValue < 1) {
      toast({ title: 'Select a rating', description: 'Please choose between 1 and 5 stars.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await apiClient.rateOrder(order._id, ratingValue, feedback)
      if (res.success) {
        toast({ title: 'Thanks for your feedback!', description: 'Your rating has been submitted.' })
        setRatingOpen(false)
        onOrderUpdate?.({
          ...order,
          ...(res.data || {}),
          rating: ratingValue,
          ratingFeedback: feedback,
          customerConfirmedDeliveryAt:
            res.data?.customerConfirmedDeliveryAt || order.customerConfirmedDeliveryAt || new Date().toISOString(),
        })
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to submit rating', variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── 1. RTO / Damaged / Lost — red banner ──────────────────────────────────
  if (hasIssue) {
    const isRTO = order.isRTO || order.deliveryStatus === 'rto_initiated' || order.deliveryStatus === 'rto_delivered'

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <RotateCcw className="h-5 w-5" />
          <p className="font-semibold">{isRTO ? 'Returning to Warehouse' : 'Shipment Issue Reported'}</p>
        </div>
        <p className="text-sm text-red-600">
          {isRTO
            ? 'This package is being returned to the warehouse. If you have questions about this order, please contact support.'
            : 'There was an issue with this shipment (damaged or lost in transit). Please contact support for assistance.'}
        </p>

        {(order.courierName || order.awbCode) && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-red-700/80">
            {order.courierName && <span>Courier: <span className="font-medium">{order.courierName}</span></span>}
            {order.awbCode && (
              <button
                type="button"
                onClick={handleCopyAwb}
                className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-0.5 font-mono text-xs hover:bg-red-100"
              >
                AWB: {order.awbCode}
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
        )}

        <Button variant="destructive" size="sm" asChild>
          <a href="/dashboard/help">Contact Support</a>
        </Button>
      </div>
    )
  }

  // ── 2. Pre-dispatch — paid but not yet pushed to Shiprocket ────────────────
  if (isPreDispatch) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Warehouse className="h-6 w-6 text-amber-600 animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-amber-800">Preparing your gear…</p>
            <p className="text-sm text-amber-700">
              We&apos;ve received your order and our team is getting it ready for dispatch. You&apos;ll see live
              tracking here as soon as it ships.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── 3. Delivered ≥ 24h — rating / confirm receipt ──────────────────────────
  if (showPostDelivery) {
    const alreadyRated = typeof order.rating === 'number'

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-semibold">
            Delivered{order.actualDeliveryAt ? ` on ${formatDate(order.actualDeliveryAt)}` : ''}
          </p>
        </div>

        {alreadyRated ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    'h-4 w-4',
                    n <= (order.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-green-700">Thanks for rating your experience!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!order.customerConfirmedDeliveryAt && (
              <Button size="sm" variant="outline" onClick={handleConfirmReceipt} disabled={confirming}>
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirm Receipt
              </Button>
            )}
            <Button size="sm" onClick={() => setRatingOpen(true)}>
              <Star className="h-4 w-4" />
              Rate Your Experience
            </Button>
          </div>
        )}

        <RatingDialog
          open={ratingOpen}
          onOpenChange={setRatingOpen}
          ratingValue={ratingValue}
          hoverRating={hoverRating}
          setRatingValue={setRatingValue}
          setHoverRating={setHoverRating}
          feedback={feedback}
          setFeedback={setFeedback}
          submitting={submitting}
          onSubmit={handleSubmitRating}
        />
      </div>
    )
  }

  // ── 4. Default — 4-stage progress stepper ──────────────────────────────────
  const currentStep = getCurrentStep(order)
  const isInTransitStage = currentStep === 3
  const stage3Label = order.deliveryStatus === 'out_for_delivery' ? 'Out for Delivery' : 'In Transit'

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Stepper */}
      <div className="flex items-start">
        {STAGES.map((stage, idx) => {
          const stepNum = idx + 1
          const Icon = stage.icon
          const isDone = stepNum < currentStep
          const isActive = stepNum === currentStep
          const isLast = idx === STAGES.length - 1

          let circleClasses = 'bg-gray-100 border-gray-300 text-gray-400'
          if (isDone) {
            circleClasses = 'bg-green-500 border-green-500 text-white'
          } else if (isActive) {
            circleClasses =
              stepNum === 4
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-blue-500 border-blue-500 text-white'
          }

          const connectorClasses = isDone ? 'bg-green-400' : 'bg-gray-200'

          return (
            <div key={stage.label} className={cn('flex flex-col items-center', !isLast && 'flex-1')}>
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    circleClasses,
                    isActive && stepNum === 3 && 'animate-pulse'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && <div className={cn('h-0.5 flex-1', connectorClasses)} />}
              </div>
              <p
                className={cn(
                  'mt-1.5 text-center text-[11px] font-medium leading-tight sm:text-xs',
                  isDone && 'text-green-600',
                  isActive && (stepNum === 4 ? 'text-green-600' : 'text-blue-600'),
                  !isDone && !isActive && 'text-gray-400'
                )}
              >
                {stepNum === 3 ? stage3Label : stage.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Details */}
      {(order.courierName || order.estimatedDeliveryDate || order.awbCode || lastEvent?.location) && (
        <div className="space-y-2 border-t pt-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {order.courierName && (
              <span>
                Courier: <span className="font-medium text-foreground">{order.courierName}</span>
              </span>
            )}
            {order.estimatedDeliveryDate && (
              <span>
                Expected delivery:{' '}
                <span className="font-medium text-foreground">{formatDate(order.estimatedDeliveryDate)}</span>
              </span>
            )}
          </div>

          {lastEvent?.location && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Last known location: <span className="font-medium text-foreground">{lastEvent.location}</span>
            </p>
          )}

          {order.awbCode && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyAwb}
                title="Tap to copy AWB number"
                className="inline-flex items-center gap-1.5 rounded border bg-muted/50 px-2.5 py-1 font-mono text-xs hover:bg-muted"
              >
                AWB: {order.awbCode}
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <Button size="sm" variant="outline" onClick={handleTrackOnShiprocket} className={cn(isInTransitStage && 'border-blue-300 text-blue-600')}>
                Track on Shiprocket
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Rating dialog ───────────────────────────────────────────────────────────

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ratingValue: number
  hoverRating: number
  setRatingValue: (value: number) => void
  setHoverRating: (value: number) => void
  feedback: string
  setFeedback: (value: string) => void
  submitting: boolean
  onSubmit: () => void
}

function RatingDialog({
  open,
  onOpenChange,
  ratingValue,
  hoverRating,
  setRatingValue,
  setHoverRating,
  feedback,
  setFeedback,
  submitting,
  onSubmit,
}: RatingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>How was your delivery? Your feedback helps us improve.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRatingValue(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  n <= (hoverRating || ratingValue) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Tell us more about your delivery experience (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={2000}
          rows={3}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
