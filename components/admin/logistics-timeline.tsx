'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Loader2, MapPin, CheckCircle2, AlertTriangle, RotateCcw, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrackingEvent {
  timestamp: string
  status: string
  activity: string
  location: string
  srStatusCode?: string
}

interface TimelineData {
  orderNumber: string
  deliveryStatus: string | null
  estimatedDeliveryDate: string | null
  actualDeliveryAt: string | null
  isRTO: boolean
  isDamaged: boolean
  isLost: boolean
  lastTrackingSync: string | null
  events: TrackingEvent[]
}

interface LogisticsTimelineProps {
  orderId: string
}

function _eventIcon(status: string) {
  const s = status.toLowerCase()
  if (s.includes('delivered') && !s.includes('rto')) return CheckCircle2
  if (s.includes('rto') || s.includes('return')) return RotateCcw
  if (s.includes('damaged') || s.includes('lost')) return AlertTriangle
  return Package
}

function _eventColour(status: string, isLast: boolean) {
  const s = status.toLowerCase()
  if (s.includes('rto') || s.includes('return') || s.includes('damaged') || s.includes('lost')) {
    return isLast ? 'text-red-600 bg-red-100 border-red-200' : 'text-red-400 bg-red-50 border-red-100'
  }
  if (s.includes('delivered')) {
    return isLast ? 'text-green-600 bg-green-100 border-green-200' : 'text-green-400 bg-green-50 border-green-100'
  }
  return isLast ? 'text-blue-600 bg-blue-100 border-blue-200' : 'text-gray-400 bg-gray-100 border-gray-200'
}

function _connectorColour(status: string) {
  const s = status.toLowerCase()
  if (s.includes('rto') || s.includes('return') || s.includes('damaged') || s.includes('lost')) return 'bg-red-200'
  if (s.includes('delivered')) return 'bg-green-200'
  return 'bg-gray-200'
}

export function LogisticsTimeline({ orderId }: LogisticsTimelineProps) {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    apiClient
      .getOrderTimeline(orderId)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) {
          setData(res.data as TimelineData)
        } else {
          setError(res.error || 'Failed to load timeline')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load timeline')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading timeline…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600 py-2">{error}</p>
  }

  if (!data || data.events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2 italic">
        No tracking events yet. Events will appear once the courier starts scanning the shipment.
      </p>
    )
  }

  // Events arrive sorted ascending from the API — show most-recent first
  const sorted = [...data.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="space-y-1">
      {data.estimatedDeliveryDate && (
        <p className="text-xs text-muted-foreground mb-3">
          Estimated delivery:{' '}
          <span className="font-medium text-foreground">
            {new Date(data.estimatedDeliveryDate).toLocaleDateString(undefined, {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </p>
      )}
      {data.lastTrackingSync && (
        <p className="text-xs text-muted-foreground mb-3">
          Last synced:{' '}
          {new Date(data.lastTrackingSync).toLocaleString(undefined, {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      <ol className="relative">
        {sorted.map((event, idx) => {
          const isFirst = idx === 0 // most recent
          const Icon = _eventIcon(event.status)
          const iconClass = _eventColour(event.status, isFirst)
          const connectorClass = idx < sorted.length - 1 ? _connectorColour(sorted[idx + 1].status) : ''

          return (
            <li key={idx} className="flex gap-3 pb-0">
              {/* Icon + connector column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                    iconClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {idx < sorted.length - 1 && (
                  <div className={cn('w-0.5 flex-1 my-1', connectorClass)} />
                )}
              </div>

              {/* Content column */}
              <div className={cn('pb-4 min-w-0', idx === sorted.length - 1 && 'pb-0')}>
                <p className={cn('text-sm font-medium leading-tight', isFirst ? 'text-foreground' : 'text-muted-foreground')}>
                  {event.activity}
                </p>
                {event.location && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {event.location}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.timestamp).toLocaleString(undefined, {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
