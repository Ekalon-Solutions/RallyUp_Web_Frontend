"use client"

import { useCallback, useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileBarChart } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

type VendorReportEvent = {
  _id: string
  title: string
  startDate?: string
  scans: number
  currentAttendees?: number
  maxAttendees?: number
}

export default function VendorReportsPage() {
  const { activeClubId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalScans, setTotalScans] = useState(0)
  const [events, setEvents] = useState<VendorReportEvent[]>([])
  const [deviceId, setDeviceId] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getVendorReports(activeClubId ?? undefined)
      if (res.success && res.data) {
        setTotalScans(res.data.totalScans ?? 0)
        setEvents(res.data.events ?? [])
        setDeviceId(res.data.vendorDeviceId ?? null)
      }
    } catch {
      toast.error("Failed to load vendor reports")
    } finally {
      setLoading(false)
    }
  }, [activeClubId])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 p-4 md:p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vendor Reports</h1>
            <p className="text-muted-foreground">Match-day scan activity across assigned clubs.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total check-ins scanned</CardDescription>
                    <CardTitle className="text-3xl">{totalScans}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Last active scanner device</CardDescription>
                    <CardTitle className="text-lg font-mono truncate">
                      {deviceId || "Not registered yet"}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5" />
                    Event scan summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scan data for the selected club yet.</p>
                  ) : (
                    <div className="divide-y">
                      {events.map((event) => (
                        <div key={event._id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            {event.startDate && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.startDate).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{event.scans} scans</p>
                            {event.maxAttendees != null && (
                              <p className="text-xs text-muted-foreground">
                                {event.currentAttendees ?? 0} / {event.maxAttendees} attendees
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
