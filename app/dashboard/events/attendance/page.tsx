"use client"

import React, { Suspense, useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, CheckCircle2, XCircle, AlertCircle,
  User, Phone, MapPin, Tag, ScanLine, ArrowLeft,
} from 'lucide-react'

type PageState = 'loading' | 'preview' | 'marking' | 'success' | 'already_marked' | 'error'

interface VenueItem {
  venueId: string
  venueName: string
  tierId: string
  tierName: string
  quantity: number
  price: number
}

interface ScanPreview {
  attendeeName: string
  attendeePhone: string
  attended: boolean
  assignedVenueName?: string
  assignedTierName?: string
  eventTitle: string
  eventVenue: string
  eventId: string
  registrationId: string
  attendeeId: string
  venueItems: VenueItem[]
}

function AttendanceLandingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registrationId')
  const attendeeId = searchParams.get('attendeeId')

  const [state, setState] = useState<PageState>('loading')
  const [preview, setPreview] = useState<ScanPreview | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!registrationId || !attendeeId) {
        setState('error')
        setErrorMessage('Missing registration ID or attendee ID')
        return
      }

      try {
        const res = await apiClient.getScanPreview(registrationId, attendeeId)
        if (!res.success) {
          setState('error')
          setErrorMessage(res.error || res.message || 'Failed to load ticket details')
          return
        }
        setPreview(res.data!)
        setState('preview')
      } catch (err: any) {
        setState('error')
        setErrorMessage(err?.message || 'An unexpected error occurred')
      }
    }
    load()
  }, [registrationId, attendeeId])

  const handleMarkAttendance = async () => {
    if (!registrationId || !attendeeId) return
    setState('marking')
    try {
      const response = await apiClient.adminLogAttendance({ registrationId, attendeeId })
      if (response.success) {
        if (typeof response.data?.pointsAwarded === 'number') {
          setPointsAwarded(response.data.pointsAwarded)
        }
        setState('success')
        toast.success(response.data?.message || 'Attendance marked successfully')
      } else {
        const msg = response.error || response.message || 'Failed to mark attendance'
        setErrorMessage(msg)
        if (msg.toLowerCase().includes('already marked') || msg.toLowerCase().includes('already attended')) {
          setState('already_marked')
        } else {
          setState('error')
        }
        toast.error(msg)
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred'
      setErrorMessage(msg)
      setState('error')
      toast.error(msg)
    }
  }

  const handleReject = () => {
    router.push('/dashboard/events/scanner')
  }

  const renderVenueItems = (items: VenueItem[] | undefined | null) => {
    if (!items?.length) return null
    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ticket Details</p>
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.venueName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.tierName}</span>
                <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>
                {item.price > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">₹{item.price}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderAttendeeCard = (p: ScanPreview) => (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendee</p>
          <p className="font-semibold truncate">{p.attendeeName}</p>
          {p.attendeePhone && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{p.attendeePhone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Loading Ticket Details
              </CardTitle>
              <CardDescription>Fetching ticket information…</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
              </div>
            </CardContent>
          </Card>
        )

      case 'preview':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-blue-600" />
                Confirm Ticket
              </CardTitle>
              <CardDescription className="font-medium text-base text-foreground mt-1">
                {preview!.eventTitle}
              </CardDescription>
              {preview!.eventVenue && !preview!.venueItems.length && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {preview!.eventVenue}
                </p>
              )}
              {(preview!.assignedVenueName || preview!.assignedTierName) && (
                <div className="mt-2 p-2 rounded-md bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Assigned Entry Zone</p>
                  <p className="text-sm text-blue-900 font-medium mt-0.5">
                    {preview!.assignedVenueName || 'Venue'}{preview!.assignedTierName ? ` - ${preview!.assignedTierName}` : ''}
                  </p>
                </div>
              )}
              {preview!.attended && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 mt-2 w-fit">
                  <AlertCircle className="w-3 h-3 mr-1" /> Already attended
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {renderAttendeeCard(preview!)}
              {renderVenueItems(preview!.venueItems)}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleReject}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Reject & Rescan
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleMarkAttendance}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Rejecting does not invalidate the QR — the member can re-scan at the correct venue.
              </p>
            </CardContent>
          </Card>
        )

      case 'marking':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Marking Attendance
              </CardTitle>
              <CardDescription>Please wait…</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
              </div>
            </CardContent>
          </Card>
        )

      case 'success':
        return (
          <Card className="max-w-md mx-auto border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Attendance Marked
              </CardTitle>
              <CardDescription className="text-green-600">
                {preview?.eventTitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-center font-medium text-green-700">Attendance recorded!</p>
                {pointsAwarded !== null && (
                  <p className="text-center font-semibold text-green-700 mt-2">+{pointsAwarded} loyalty points</p>
                )}
              </div>
              {preview && renderAttendeeCard(preview)}
              {preview && renderVenueItems(preview.venueItems)}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/events/scanner')}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Scan Next
              </Button>
            </CardContent>
          </Card>
        )

      case 'already_marked':
        return (
          <Card className="max-w-md mx-auto border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Already Marked
              </CardTitle>
              <CardDescription className="text-yellow-600">
                {errorMessage || 'This attendee has already been marked as present.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                </div>
              </div>
              {preview && renderAttendeeCard(preview)}
              {preview && renderVenueItems(preview.venueItems)}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/events/scanner')}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Scan Next
              </Button>
            </CardContent>
          </Card>
        )

      case 'error':
        return (
          <Card className="max-w-md mx-auto border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5 text-red-600" />
                Error
              </CardTitle>
              <CardDescription className="text-red-600">
                {errorMessage || 'An error occurred.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push('/dashboard/events/scanner')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scanner
              </Button>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="p-6 min-h-screen flex items-center justify-center">
          <div className="w-full">
            <h1 className="text-2xl font-bold mb-6 text-center">Event Attendance</h1>
            {renderContent()}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function AttendanceLandingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AttendanceLandingPageInner />
    </Suspense>
  )
}
