'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { RefundConfirmationModal } from './modals/refund-confirmation-modal'
import { getApiUrl } from '@/lib/config'
import { useToast } from '@/hooks/use-toast'

interface RefundButtonProps {
  sourceType: 'event_ticket' | 'store_order'
  eventId?: string
  orderId?: string
  onRefundRequested?: () => void
}

interface RefundEstimate {
  eligible: boolean
  cutoff: string | null
  estimatedRefund: number
  currency: string
  breakdown?: {
    grossPaid?: number
    taxesExcluded?: number
    platformFeesExcluded?: number
    paymentGatewayFeesExcluded?: number
  } | null
}

export function RefundButton({ sourceType, eventId, orderId, onRefundRequested }: RefundButtonProps) {
  const { toast } = useToast()
  const [estimate, setEstimate] = useState<RefundEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEstimate()
  }, [sourceType, eventId, orderId])

  const fetchEstimate = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/refunds/estimate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceType, eventId, orderId })
      })

      const data = await response.json()
      
      if (response.ok && data.success && data.data) {
        setEstimate(data.data)
      } else {
        setError(data.message || 'Failed to load refund information')
      }
    } catch (err: any) {
      console.error('Failed to fetch refund estimate:', err)
      setError('Failed to load refund information')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRefund = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/refunds/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceType, eventId, orderId })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setShowModal(false)
        onRefundRequested?.()
        const msg = sourceType === 'event_ticket'
          ? 'Ticket cancelled : Refund will be processed in 5-7 working days excluding the platform fees, payment gateway fees and taxes. Please refer to the refund policy for more details.'
          : 'Order cancelled : Refund will be processed in 5-7 working days excluding the platform fees, payment gateway fees and taxes. Please refer to the refund policy for more details.'
        toast({ title: sourceType === 'event_ticket' ? 'Ticket cancelled' : 'Order cancelled', description: msg })
      } else {
        setError(data.message || 'Failed to request refund')
      }
    } catch (err: any) {
      setError('Failed to request refund')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !estimate) {
    return (
      <Button disabled variant="outline" size="sm">
        Loading...
      </Button>
    )
  }

  if (error && !estimate) {
    return null
  }

  if (!estimate) {
    return null
  }

  const isPastCutoff = !estimate.eligible
  const cutoffDate = estimate.cutoff ? new Date(estimate.cutoff) : null

  const formatCurrency = (amt: number, cur: string) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
    return `${symbols[cur] || cur} ${amt.toFixed(2)}`
  }

  return (
    <>
      {!isPastCutoff && (
        <p className="text-sm font-medium text-green-600 dark:text-green-500 mb-2">
          Estimated Refund: {formatCurrency(estimate.estimatedRefund, estimate.currency)}
        </p>
      )}
      <Button
        onClick={() => setShowModal(true)}
        disabled={isPastCutoff || loading}
        variant={isPastCutoff ? 'outline' : 'destructive'}
        size="sm"
        className="w-full sm:w-auto"
      >
        {isPastCutoff ? 'Refund Unavailable' : 'Request Refund'}
      </Button>

      {isPastCutoff && cutoffDate && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Refund cutoff was {cutoffDate.toLocaleString()}
        </p>
      )}

      {showModal && (
        <RefundConfirmationModal
          estimate={estimate}
          sourceType={sourceType}
          loading={loading}
          error={error}
          onConfirm={handleRequestRefund}
          onCancel={() => {
            setShowModal(false)
            setError(null)
          }}
        />
      )}
    </>
  )
}
