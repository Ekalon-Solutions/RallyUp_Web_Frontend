"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, RefreshCw, Filter } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface ReconciliationGroup {
  _id: string | null
  totalRevenue: number
  ticketCount: number
  registrations: Array<{
    eventId: string
    eventTitle: string
    eventStartTime: string
    userId: string
    userName: string
    userEmail: string
    amountPaid: number
    currency: string
    registrationDate: string
    attributed_club: string | null
  }>
}

export default function RevenueReconciliationPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ReconciliationGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClub, setFilterClub] = useState<string>("__all__")
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const clubId = (() => {
    const u = user as any
    return u?.club?._id ?? u?.club ?? ""
  })()

  const allClubs = Array.from(
    new Set(data.map((g) => g._id).filter(Boolean) as string[])
  ).sort()

  const fetch = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const club = filterClub === "__all__" ? undefined : filterClub
      const res = await apiClient.getRevenueReconciliation(clubId, club)
      if (res.success && res.data) {
        setData(res.data)
      } else {
        toast.error(res.error ?? "Failed to load reconciliation data")
      }
    } catch {
      toast.error("Error loading reconciliation data")
    } finally {
      setLoading(false)
    }
  }, [clubId, filterClub])

  useEffect(() => {
    fetch()
  }, [fetch])

  const formatCurrency = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  }

  const grandTotal = data.reduce((sum, g) => sum + g.totalRevenue, 0)
  const grandCount = data.reduce((sum, g) => sum + g.ticketCount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex-1">Revenue Reconciliation</h1>
          <Button variant="outline" size="sm" onClick={fetch} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Revenue attributed to partner clubs from joint screening events. Each row shows earnings grouped by the club affiliation selected at checkout.
        </p>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by club:</span>
          <Select value={filterClub} onValueChange={setFilterClub}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All clubs</SelectItem>
              {allClubs.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No attributed registrations found. Joint screening events with partner club selections will appear here.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">{grandCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Groups */}
            <div className="space-y-4">
              {data.map((group) => {
                const key = group._id ?? "__unattributed__"
                const label = group._id ?? "Unattributed"
                const isExpanded = expandedGroup === key
                return (
                  <Card key={key}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setExpandedGroup(isExpanded ? null : key)}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Badge variant={group._id ? "default" : "secondary"}>{label}</Badge>
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{group.ticketCount} ticket{group.ticketCount !== 1 ? "s" : ""}</span>
                          <span className="font-semibold">{formatCurrency(group.totalRevenue)}</span>
                          <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent>
                        <Separator className="mb-4" />
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground text-left border-b">
                                <th className="pb-2 pr-4">Buyer</th>
                                <th className="pb-2 pr-4">Event</th>
                                <th className="pb-2 pr-4">Date</th>
                                <th className="pb-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {group.registrations.map((reg, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                  <td className="py-2 pr-4">
                                    <p className="font-medium">{reg.userName}</p>
                                    <p className="text-xs text-muted-foreground">{reg.userEmail}</p>
                                  </td>
                                  <td className="py-2 pr-4">
                                    <p>{reg.eventTitle}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {reg.eventStartTime ? new Date(reg.eventStartTime).toLocaleDateString() : ""}
                                    </p>
                                  </td>
                                  <td className="py-2 pr-4 text-muted-foreground">
                                    {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : ""}
                                  </td>
                                  <td className="py-2 text-right font-medium">
                                    {formatCurrency(reg.amountPaid ?? 0, reg.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
