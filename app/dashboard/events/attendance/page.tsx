"use client"

import React, { useEffect } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

export default function AttendanceLandingPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const userId = searchParams.get('userId')
  const eventId = searchParams.get('eventId')

  useEffect(() => {
    const callApi = async () => {
      try {
        const response = await apiClient.adminLogAttendance({ token, userId, eventId })
        if (!response.success) {
          toast.error(response.error || 'Failed to call attendance API')
          return
        }

        toast.success(response.data?.message || 'Attendance logged')
      } catch (error) {
        console.error('Error calling attendance API', error)
        toast.error('Error calling attendance API')
      }
    }

    callApi()
  }, [token, userId, eventId])

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Event Attendance</h1>
          <p className="text-muted-foreground mt-2">Processing attendance check-in...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
