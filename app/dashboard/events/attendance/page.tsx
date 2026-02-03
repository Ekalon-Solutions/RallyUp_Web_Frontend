"use client"

import React, { Suspense, useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, AlertCircle, User, Phone } from 'lucide-react'

type AttendanceState = 'loading' | 'success' | 'error' | 'already_marked' | 'server_error'

interface AttendeeInfo {
  name: string
  phone: string
}

function AttendanceLandingPageInner() {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registrationId')
  const attendeeId = searchParams.get('attendeeId')
  const [state, setState] = useState<AttendanceState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo | null>(null)

  useEffect(() => {
    const fetchAttendeeInfo = async () => {
      if (!registrationId || !attendeeId) return

      try {
        const regResponse = await apiClient.getRegistrationById(registrationId)
        if (regResponse.success && regResponse.data?.registration) {
          const registration = regResponse.data.registration
          const attendee = (registration.attendees || []).find(
            (a: any) => String(a._id) === String(attendeeId)
          )
          if (attendee) {
            setAttendeeInfo({
              name: attendee.name || 'Unknown',
              phone: attendee.phone || 'N/A'
            })
          }
        }
      } catch (error) {
      }
    }

    const callApi = async () => {
      if (!registrationId || !attendeeId) {
        setState('error')
        setErrorMessage('Missing registration ID or attendee ID')
        toast.error('Missing required parameters')
        return
      }

      setState('loading')
      
      await fetchAttendeeInfo()
      
      try {
        const response = await apiClient.adminLogAttendance({registrationId, attendeeId})
        
        if (response.success && response.data?.registration) {
          const registration = response.data.registration
          const attendee = (registration.attendees || []).find(
            (a: any) => String(a._id) === String(attendeeId)
          )
          if (attendee) {
            setAttendeeInfo({
              name: attendee.name || 'Unknown',
              phone: attendee.phone || 'N/A'
            })
          }
        }
        
        if (!response.success) {
          const errorMsg = response.error || response.message || 'Failed to mark attendance'
          setErrorMessage(errorMsg)
          
          const statusCode = response.status || response.errorDetails?.status
          
          if (errorMsg.toLowerCase().includes('already marked') || 
              errorMsg.toLowerCase().includes('already attended')) {
            setState('already_marked')
            toast.error(errorMsg)
          } else if (statusCode === 500 || errorMsg.toLowerCase().includes('server error')) {
            setState('server_error')
            toast.error('Server error occurred while marking attendance')
          } else {
            setState('error')
            toast.error(errorMsg)
          }
          return
        }

        setState('success')
        toast.success(response.data?.message || 'Attendance marked successfully')
      } catch (error: any) {
        const errorMsg = error?.message || error?.error || error?.errorDetails?.details || 'An unexpected error occurred'
        setErrorMessage(errorMsg)
        
        const statusCode = error?.status || error?.statusCode || error?.errorDetails?.status
        if (statusCode === 500 || errorMsg.toLowerCase().includes('server error')) {
          setState('server_error')
          toast.error('Server error occurred while marking attendance')
        } else {
          setState('error')
          toast.error('Error calling attendance API')
        }
      }
    }

    callApi()
  }, [registrationId, attendeeId])

  const renderAttendeeInfo = () => {
    if (!attendeeInfo) return null
    
    return (
      <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-muted-foreground">Attendee</p>
            <p className="font-semibold">{attendeeInfo.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{attendeeInfo.phone}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Marking Attendance
              </CardTitle>
              <CardDescription>Please wait while we process your attendance...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
                <p className="text-muted-foreground text-center">
                  Processing attendance check-in...
                </p>
              </div>
              {renderAttendeeInfo()}
            </CardContent>
          </Card>
        )

      case 'success':
        return (
          <Card className="max-w-md mx-auto border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Attendance Marked Successfully
              </CardTitle>
              <CardDescription className="text-green-600">
                The attendee has been successfully marked as present.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-center font-medium text-green-700">
                  Attendance has been recorded!
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  The attendee is now marked as present for this event.
                </p>
              </div>
              {renderAttendeeInfo()}
            </CardContent>
          </Card>
        )

      case 'already_marked':
        return (
          <Card className="max-w-md mx-auto border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Attendance Already Marked
              </CardTitle>
              <CardDescription className="text-yellow-600">
                This attendee has already been marked as present.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                </div>
                <p className="text-center font-medium text-yellow-700">
                  Attendance was already recorded
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {errorMessage || 'This attendee has already been marked as present for this event.'}
                </p>
              </div>
              {renderAttendeeInfo()}
            </CardContent>
          </Card>
        )

      case 'server_error':
        return (
          <Card className="max-w-md mx-auto border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5 text-red-600" />
                Server Error
              </CardTitle>
              <CardDescription className="text-red-600">
                A server error occurred while marking attendance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-center font-medium text-red-700">
                  Failed to mark attendance
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {errorMessage || 'A server error (500) occurred. Please try again later or contact support.'}
                </p>
              </div>
              {renderAttendeeInfo()}
            </CardContent>
          </Card>
        )

      case 'error':
        return (
          <Card className="max-w-md mx-auto border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5 text-red-600" />
                Attendance Marking Failed
              </CardTitle>
              <CardDescription className="text-red-600">
                Unable to mark attendance at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-center font-medium text-red-700">
                  Failed to mark attendance
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {errorMessage || 'An error occurred while marking attendance. Please try again.'}
                </p>
              </div>
              {renderAttendeeInfo()}
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
