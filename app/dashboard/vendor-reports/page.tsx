"use client"

import { useCallback, useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileBarChart, Users, UserPlus, Radio } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

const POLL_MS = 30_000

export default function VendorReportsPage() {
  const { activeClubId, isVendor, user } = useAuth()
  const isVendorUser = isVendor || user?.role === "vendor"
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<{
    myTotalScans: number
    memberCheckIns: number
    guestWalkIns: number
    zoneTurnout: number
    maxCapacity: number | null
    turnoutPercent: number | null
    recentScans: Array<{
      attendanceId: string
      attendeeName: string
      attendeeCategory: "member" | "guest"
      scannedAt: string
    }>
    syncedAt: string
  } | null>(null)
  const [liveScreening, setLiveScreening] = useState<{
    events: Array<{
      eventId: string
      title: string
      totalCheckIns: number
      memberCheckIns: number
      guestWalkIns: number
      turnoutPercent: number | null
      maxCapacity: number | null
      gates: Array<{ gateZone: string; count: number }>
    }>
    syncedAt: string
  } | null>(null)

  const load = useCallback(async () => {
    if (!activeClubId) {
      setLoading(false)
      return
    }
    try {
      if (isVendorUser) {
        const res = await apiClient.getVendorAttendanceDashboard({ clubId: activeClubId })
        if (res.success && res.data) {
          setDashboard(res.data)
        }
      } else {
        const res = await apiClient.getAdminLiveScreening(activeClubId)
        if (res.success && res.data) {
          setLiveScreening(res.data)
        }
      }
    } catch {
      toast.error("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }, [activeClubId, isVendorUser])

  useEffect(() => {
    setLoading(true)
    void load()
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 p-4 md:p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isVendorUser ? "My Attendance Log" : "Live Screening Hub"}
            </h1>
            <p className="text-muted-foreground">
              {isVendorUser
                ? "Your scan counts and recent check-ins — updates every 30 seconds."
                : "Club-wide live turnout across all gates and vendors."}
            </p>
          </div>

          {loading && !dashboard && !liveScreening ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isVendorUser && dashboard ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>My scans</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{dashboard.myTotalScans}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Member check-ins
                    </CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{dashboard.memberCheckIns}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <UserPlus className="h-3.5 w-3.5" /> Guest walk-ins
                    </CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{dashboard.guestWalkIns}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {dashboard.maxCapacity != null && dashboard.maxCapacity > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Turnout</CardTitle>
                    <CardDescription>
                      {dashboard.zoneTurnout} / {dashboard.maxCapacity} ({dashboard.turnoutPercent ?? 0}%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, dashboard.turnoutPercent ?? 0)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5" />
                    Recent scans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.recentScans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scans recorded yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {dashboard.recentScans.map((scan) => (
                        <li key={scan.attendanceId} className="flex justify-between py-3">
                          <div>
                            <p className="font-medium">{scan.attendeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {scan.attendeeCategory === "member" ? "Member" : "Guest"}
                            </p>
                          </div>
                          <p className="text-sm tabular-nums text-muted-foreground">
                            {new Date(scan.scannedAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          ) : liveScreening ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="h-4 w-4 text-emerald-500" />
                Live · synced {new Date(liveScreening.syncedAt).toLocaleTimeString()}
              </div>
              {liveScreening.events.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No live screening data for this club yet.
                  </CardContent>
                </Card>
              ) : (
                liveScreening.events.map((event) => (
                  <Card key={event.eventId}>
                    <CardHeader>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        {event.totalCheckIns} check-ins · {event.memberCheckIns} members ·{" "}
                        {event.guestWalkIns} guests
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {event.maxCapacity != null && event.maxCapacity > 0 && (
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>Turnout</span>
                            <span>{event.turnoutPercent ?? 0}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, event.turnoutPercent ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {event.gates.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {event.gates.map((g) => (
                            <span
                              key={g.gateZone}
                              className="rounded-md border px-2 py-1 text-xs"
                            >
                              {g.gateZone}: {g.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
