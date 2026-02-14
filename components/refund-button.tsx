'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { RefundConfirmationModal } from './modals/refund-confirmation-modal'
import { getApiUrl } from '@/lib/config'

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
  breakdown: {
    grossPaid: number
    taxesExcluded: number
    platformFeesExcluded: number
    paymentGatewayFeesExcluded: number
  }
}

export function RefundButton({ sourceType, eventId, orderId, onRefundRequested }: RefundButtonProps) {
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
      
      if (response.ok && data.success && data.data.ok) {
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
        
        const message = sourceType === 'event_ticket'
          ? 'Ticket cancelled : Refund will be processed in 5-7 working days excluding the platform fees, payment gateway fees and taxes. Please refer to the refund policy for more details.'
          : 'Order cancelled : Refund will be processed in 5-7 working days excluding the platform fees, payment gateway fees and taxes. Please refer to the refund policy for more details.'
        
        alert(message)
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

  return (
    <>
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
