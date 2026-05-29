"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Download, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

type PolicyFilter = "all" | "refundable" | "non_refundable"

type LogRow = {
  eventId: string
  eventTitle: string
  eventStartTime: string | null
  registrationId: string | null
  orderId: string | null
  userId: string
  userName: string
  userEmail: string
  amountPaid: number
  currency: string
  purchaseDate: string | null
  policyAtPurchase: string
  policyAtPurchaseAllowed: boolean
  refundLogStatus: string
  cancellationTimestamp: string | null
  manualOverride: boolean
  blockedByPolicy: boolean
  blockedSavingsValue: number
}

type ReportData = {
  rows: LogRow[]
  pagination: { page: number; limit: number; totalItems: number; totalPages: number }
  summary: {
    totalTickets: number
    totalRevenue: number
    totalSavings: number
    blockedAttemptCount: number
    manualOverrideCount: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  refund_requested: "Refund Requested",
  refund_processed: "Refund Processed",
  refund_rejected: "Refund Rejected",
  blocked_by_policy: "Blocked by Policy",
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return iso
  }
}

export function EventRefundLogPanel() {
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [policyFilter, setPolicyFilter] = useState<PolicyFilter>("all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ReportData | null>(null)

  const fetchLog = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const res = await apiClient.getEventRefundLog({
        clubId,
        policyFilter,
        page,
        limit: 50,
      })
      if (res.success && res.data) {
        setData(res.data as ReportData)
      } else {
        toast.error(res.error ?? "Failed to load event refund log")
        setData(null)
      }
    } catch {
      toast.error("Error loading event refund log")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [clubId, policyFilter, page])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  useEffect(() => {
    setPage(1)
  }, [policyFilter])

  const handleExport = async () => {
    if (!clubId) return
    setExporting(true)
    try {
      const res = await apiClient.downloadEventRefundLogCsv({ clubId, policyFilter })
      if (!res.success) toast.error(res.error ?? "Export failed")
    } catch {
      toast.error("Export failed")
    } finally {
      setExporting(false)
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Policy filter:</span>
          <Select value={policyFilter} onValueChange={(v) => setPolicyFilter(v as PolicyFilter)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="refundable">Refundable at purchase</SelectItem>
              <SelectItem value="non_refundable">Non-refundable at purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || loading}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Tickets logged</p>
              <p className="text-2xl font-bold">{summary.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Ticket revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-900">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total savings (blocked refunds)</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {formatCurrency(summary.totalSavings)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.blockedAttemptCount} blocked attempt{summary.blockedAttemptCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Manual overrides</p>
              <p className="text-2xl font-bold">{summary.manualOverrideCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event refund log</CardTitle>
          <CardDescription>
            Ticket-level refund status for revenue reconciliation. Each row links to an order ID and records policy at
            time of purchase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.rows.length ? (
            <p className="text-center text-muted-foreground py-12">No ticket records match this filter.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Policy at purchase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cancellation</TableHead>
                      <TableHead>Override</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, i) => (
                      <TableRow key={`${row.orderId ?? row.registrationId ?? i}`}>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate" title={row.orderId ?? undefined}>
                          {row.orderId ?? "—"}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{row.eventTitle}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(row.eventStartTime)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{row.userName}</p>
                          <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(row.amountPaid, row.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.policyAtPurchaseAllowed ? "secondary" : "outline"}>
                            {row.policyAtPurchase}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.refundLogStatus === "blocked_by_policy"
                                ? "destructive"
                                : row.refundLogStatus === "refund_processed"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {STATUS_LABELS[row.refundLogStatus] ?? row.refundLogStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(row.cancellationTimestamp)}
                        </TableCell>
                        <TableCell className="text-sm">{row.manualOverride ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalItems} tickets)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
