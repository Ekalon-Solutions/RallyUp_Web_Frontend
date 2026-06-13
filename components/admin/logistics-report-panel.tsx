"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Download, ShieldAlert, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { apiClient, LogisticsOrderRow, LogisticsReportResult } from "@/lib/api"
import {
  MasterReportTable,
  RtoAnalysisTable,
  ZonePerformanceTable,
  CourierStatsTable,
  DELIVERY_STATUS_LABELS,
  formatCurrency,
} from "./logistics-report-tables"
import { cn } from "@/lib/utils"

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

interface LogisticsReportPanelProps {
  clubId: string
}

export function LogisticsReportPanel({ clubId }: LogisticsReportPanelProps) {
  const [deliveryStatus, setDeliveryStatus] = useState("all")
  const [courierName, setCourierName] = useState("all")
  const [month, setMonth] = useState(currentMonth())
  const [courierOptions, setCourierOptions] = useState<string[]>([])
  const [data, setData] = useState<LogisticsReportResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [editingOrder, setEditingOrder] = useState<LogisticsOrderRow | null>(null)

  const filters = {
    clubId,
    deliveryStatus: deliveryStatus !== "all" ? deliveryStatus : undefined,
    courierName: courierName !== "all" ? courierName : undefined,
    month,
  }

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getLogisticsReport(filters)
      if (res.success && res.data) {
        setData(res.data)
        if (courierName === "all") {
          setCourierOptions(res.data.courierStats.map((c) => c.courierName))
        }
      } else {
        toast.error(res.message || "Failed to load logistics report")
        setData(null)
      }
    } catch {
      toast.error("Error loading logistics report")
      setData(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, deliveryStatus, courierName, month])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await apiClient.downloadLogisticsReport(filters)
      if (!res.success) toast.error(res.error || "Export failed")
    } catch {
      toast.error("Export failed")
    } finally {
      setExporting(false)
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Delivery Status</Label>
              <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Courier Partner</Label>
              <Select value={courierName} onValueChange={setCourierName}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All couriers</SelectItem>
                  {courierOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={exporting || loading} className="ml-auto">
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* P&L / Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Orders this period</p>
              <p className="text-2xl font-bold">{summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Avg Delivery Time (Payment → Delivery)</p>
              <p className="text-2xl font-bold">{summary.avgDeliveryDays != null ? `${summary.avgDeliveryDays}d` : "—"}</p>
            </CardContent>
          </Card>
          <Card className={cn(summary.rtoCount > 0 && "border-red-200 dark:border-red-900")}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">RTO Rate</p>
              <p className="text-2xl font-bold">{summary.rtoRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.rtoCount} returned shipment{summary.rtoCount !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
          <Card className={cn(summary.weightDiscrepancyCount > 0 && "border-yellow-300 dark:border-yellow-800")}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {summary.weightDiscrepancyCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />}
                Weight Discrepancy Alerts
              </p>
              <p className="text-2xl font-bold">{summary.weightDiscrepancyCount}</p>
            </CardContent>
          </Card>

          {summary.shippingCostsRestricted ? (
            <Card className="sm:col-span-2 lg:col-span-4 border-muted">
              <CardContent className="pt-4 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Shipping cost and Logistics P&L figures are restricted to the club's Primary Admin or Store
                  Manager.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Shipping Fee Collected</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalShippingFeeCollected)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Shiprocket Freight Charged</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalShiprocketFreightCharged)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">RTO Return Costs</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalRtoCharges)}</p>
                </CardContent>
              </Card>
              <Card
                className={cn(
                  (summary.logisticsProfitLoss || 0) >= 0
                    ? "border-green-200 dark:border-green-900"
                    : "border-red-200 dark:border-red-900"
                )}
              >
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {(summary.logisticsProfitLoss || 0) >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                    )}
                    Logistics Profit / Loss
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      (summary.logisticsProfitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {formatCurrency(summary.logisticsProfitLoss)}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Report tables */}
      <Card>
        <CardHeader>
          <CardTitle>Logistics Report</CardTitle>
          <CardDescription>
            Shipping performance, RTO analysis, zone coverage, and courier success rates for{" "}
            {summary?.month || month}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="master">
              <TabsList>
                <TabsTrigger value="master">Master Report</TabsTrigger>
                <TabsTrigger value="rto">RTO Analysis</TabsTrigger>
                <TabsTrigger value="zone">Zone Performance</TabsTrigger>
                <TabsTrigger value="courier">Courier Performance</TabsTrigger>
              </TabsList>
              <TabsContent value="master" className="mt-4">
                <MasterReportTable
                  orders={data?.orders || []}
                  canViewCosts={!summary?.shippingCostsRestricted}
                  onEdit={setEditingOrder}
                />
              </TabsContent>
              <TabsContent value="rto" className="mt-4">
                <RtoAnalysisTable
                  rows={data?.rtoAnalysis || []}
                  canViewCosts={!summary?.shippingCostsRestricted}
                  onEdit={setEditingOrder}
                />
              </TabsContent>
              <TabsContent value="zone" className="mt-4">
                <ZonePerformanceTable rows={data?.zonePerformance || []} />
              </TabsContent>
              <TabsContent value="courier" className="mt-4">
                <CourierStatsTable rows={data?.courierStats || []} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <EditLogisticsDialog order={editingOrder} onClose={() => setEditingOrder(null)} onSaved={fetchReport} />
    </div>
  )
}

interface EditLogisticsDialogProps {
  order: LogisticsOrderRow | null
  onClose: () => void
  onSaved: () => void
}

function EditLogisticsDialog({ order, onClose, onSaved }: EditLogisticsDialogProps) {
  const [chargedWeight, setChargedWeight] = useState("")
  const [freightCharge, setFreightCharge] = useState("")
  const [rtoCharge, setRtoCharge] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (order) {
      setChargedWeight(order.shiprocketChargedWeight != null ? String(order.shiprocketChargedWeight) : "")
      setFreightCharge(order.shiprocketFreightCharge != null ? String(order.shiprocketFreightCharge) : "")
      setRtoCharge(order.rtoCharge != null ? String(order.rtoCharge) : "")
    }
  }, [order])

  if (!order) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: { shiprocketChargedWeight?: number; shiprocketFreightCharge?: number; rtoCharge?: number } = {}
      if (chargedWeight !== "") payload.shiprocketChargedWeight = Number(chargedWeight)
      if (freightCharge !== "") payload.shiprocketFreightCharge = Number(freightCharge)
      if (rtoCharge !== "") payload.rtoCharge = Number(rtoCharge)

      const res = await apiClient.updateOrderLogistics(order._id, payload)
      if (res.success) {
        toast.success("Logistics data updated")
        onSaved()
        onClose()
      } else {
        toast.error(res.message || "Failed to update logistics data")
      }
    } catch {
      toast.error("Failed to update logistics data")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reconcile Shipping Costs — {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Enter the figures from your Shiprocket invoice for this shipment to keep the logistics report accurate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="chargedWeight">Shiprocket charged weight (kg)</Label>
            <Input
              id="chargedWeight"
              type="number"
              min="0"
              step="0.01"
              value={chargedWeight}
              onChange={(e) => setChargedWeight(e.target.value)}
              placeholder={order.estimatedWeight != null ? `Estimated: ${order.estimatedWeight}kg` : "e.g. 1.2"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freightCharge">Shiprocket freight charge (₹)</Label>
            <Input
              id="freightCharge"
              type="number"
              min="0"
              step="0.01"
              value={freightCharge}
              onChange={(e) => setFreightCharge(e.target.value)}
              placeholder="e.g. 65"
            />
          </div>
          {order.isRTO && (
            <div className="space-y-1.5">
              <Label htmlFor="rtoCharge">Return trip cost (₹)</Label>
              <Input
                id="rtoCharge"
                type="number"
                min="0"
                step="0.01"
                value={rtoCharge}
                onChange={(e) => setRtoCharge(e.target.value)}
                placeholder="e.g. 65"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
