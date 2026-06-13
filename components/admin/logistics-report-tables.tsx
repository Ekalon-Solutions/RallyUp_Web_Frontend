"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, ExternalLink, Pencil, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { formatLocalDate } from "@/lib/timezone"
import type { LogisticsCourierRow, LogisticsOrderRow, LogisticsZoneRow } from "@/lib/api"
import { cn } from "@/lib/utils"

export function formatCurrency(amount: number | undefined | null, currency = "INR") {
  if (amount === undefined || amount === null) return "—"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  rto_initiated: "RTO Initiated",
  rto_delivered: "RTO Delivered",
  damaged: "Damaged",
  lost: "Lost",
}

function deliveryStatusBadgeVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline"
  if (status === "delivered") return "default"
  if (status.startsWith("rto") || status === "damaged" || status === "lost") return "destructive"
  return "secondary"
}

function copyToClipboard(value: string, label: string) {
  navigator.clipboard.writeText(value)
  toast.success(`${label} copied to clipboard`)
}

interface MasterReportTableProps {
  orders: LogisticsOrderRow[]
  canViewCosts: boolean
  onEdit: (order: LogisticsOrderRow) => void
}

export function MasterReportTable({ orders, canViewCosts, onEdit }: MasterReportTableProps) {
  if (!orders.length) {
    return <p className="text-center text-muted-foreground py-12">No orders match these filters.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Courier</TableHead>
            <TableHead>Delivery Status</TableHead>
            <TableHead>AWB</TableHead>
            <TableHead className="text-right">Days Taken</TableHead>
            <TableHead className="text-right">Weight (Est / Billed)</TableHead>
            {canViewCosts && <TableHead className="text-right">Shipping Cost</TableHead>}
            {canViewCosts && <TableHead className="text-right">Freight Charge</TableHead>}
            {canViewCosts && <TableHead className="text-right">Net</TableHead>}
            {canViewCosts && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const net =
              o.shippingCost !== undefined
                ? (o.shippingCost || 0) - (o.shiprocketFreightCharge || 0) - (o.isRTO ? o.rtoCharge || 0 : 0)
                : undefined
            return (
              <TableRow key={o._id} className={cn(o.weightDiscrepancy && "bg-yellow-50 dark:bg-yellow-950/30")}>
                <TableCell>
                  <p className="font-medium text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatLocalDate(o.createdAt, "date-short")}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{o.memberName}</p>
                  <p className="text-xs text-muted-foreground">{o.memberEmail}</p>
                </TableCell>
                <TableCell className="text-sm">
                  <p>{o.pincode}</p>
                  <p className="text-xs text-muted-foreground">{o.city}</p>
                </TableCell>
                <TableCell className="text-sm">{o.courierName || "—"}</TableCell>
                <TableCell>
                  <Badge variant={deliveryStatusBadgeVariant(o.deliveryStatus)}>
                    {o.deliveryStatus ? DELIVERY_STATUS_LABELS[o.deliveryStatus] || o.deliveryStatus : "Pre-dispatch"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {o.awbCode ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(o.awbCode!, "AWB number")}
                        className="font-mono text-xs hover:underline flex items-center gap-1"
                        title="Tap to copy"
                      >
                        {o.awbCode}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <a
                        href={`https://shiprocket.co/tracking/${o.awbCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Track on Shiprocket"
                      >
                        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </a>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {o.daysToDeliver != null ? (
                    <span className={o.onTime === false ? "text-red-600 font-medium" : ""}>
                      {o.daysToDeliver}d
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span className="flex items-center justify-end gap-1">
                    {o.weightDiscrepancy && <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />}
                    {o.estimatedWeight != null ? `${o.estimatedWeight}kg` : "—"} /{" "}
                    {o.shiprocketChargedWeight != null ? `${o.shiprocketChargedWeight}kg` : "—"}
                  </span>
                </TableCell>
                {canViewCosts && (
                  <TableCell className="text-right text-sm">{formatCurrency(o.shippingCost)}</TableCell>
                )}
                {canViewCosts && (
                  <TableCell className="text-right text-sm">{formatCurrency(o.shiprocketFreightCharge)}</TableCell>
                )}
                {canViewCosts && (
                  <TableCell className={cn("text-right text-sm font-medium", net !== undefined && net < 0 && "text-red-600")}>
                    {net !== undefined ? formatCurrency(net) : "—"}
                  </TableCell>
                )}
                {canViewCosts && (
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(o)} title="Edit logistics costs">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

interface RtoAnalysisTableProps {
  rows: LogisticsOrderRow[]
  canViewCosts: boolean
  onEdit: (order: LogisticsOrderRow) => void
}

export function RtoAnalysisTable({ rows, canViewCosts, onEdit }: RtoAnalysisTableProps) {
  if (!rows.length) {
    return <p className="text-center text-muted-foreground py-12">No RTO / return shipments in this period.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Courier</TableHead>
            <TableHead>AWB</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            {canViewCosts && <TableHead className="text-right">Shipping Fee Collected</TableHead>}
            {canViewCosts && <TableHead className="text-right">Return Trip Cost</TableHead>}
            {canViewCosts && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o._id}>
              <TableCell className="font-medium text-sm">{o.orderNumber}</TableCell>
              <TableCell>
                <p className="text-sm">{o.memberName}</p>
                <p className="text-xs text-muted-foreground">{o.memberEmail}</p>
              </TableCell>
              <TableCell className="text-sm">{o.courierName || "—"}</TableCell>
              <TableCell className="font-mono text-xs">{o.awbCode || "—"}</TableCell>
              <TableCell>
                <Badge variant="destructive">
                  {o.deliveryStatus ? DELIVERY_STATUS_LABELS[o.deliveryStatus] || o.deliveryStatus : "RTO"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm max-w-[260px]">{o.rtoReason || "Not specified"}</TableCell>
              {canViewCosts && <TableCell className="text-right text-sm">{formatCurrency(o.shippingCost)}</TableCell>}
              {canViewCosts && <TableCell className="text-right text-sm">{formatCurrency(o.rtoCharge)}</TableCell>}
              {canViewCosts && (
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(o)} title="Edit return trip cost">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ZonePerformanceTable({ rows }: { rows: LogisticsZoneRow[] }) {
  if (!rows.length) {
    return <p className="text-center text-muted-foreground py-12">No delivery zone data for this period.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pincode</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Avg Delivery Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((z) => (
            <TableRow key={`${z.pincode}-${z.city}`}>
              <TableCell className="font-mono text-sm">{z.pincode || "—"}</TableCell>
              <TableCell className="text-sm">{z.city || "—"}</TableCell>
              <TableCell className="text-right text-sm font-medium">{z.orderCount}</TableCell>
              <TableCell className="text-right text-sm">
                {z.avgDeliveryDays != null ? `${z.avgDeliveryDays}d` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function CourierStatsTable({ rows }: { rows: LogisticsCourierRow[] }) {
  if (!rows.length) {
    return <p className="text-center text-muted-foreground py-12">No courier activity for this period.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Courier</TableHead>
            <TableHead className="text-right">Total Orders</TableHead>
            <TableHead className="text-right">Delivered</TableHead>
            <TableHead className="text-right">On-Time Rate</TableHead>
            <TableHead className="text-right">RTO Rate</TableHead>
            <TableHead className="text-right">Avg Delivery Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.courierName}>
              <TableCell className="font-medium text-sm">{c.courierName}</TableCell>
              <TableCell className="text-right text-sm">{c.totalOrders}</TableCell>
              <TableCell className="text-right text-sm">{c.deliveredCount}</TableCell>
              <TableCell className="text-right text-sm">
                {c.onTimeRate != null ? `${c.onTimeRate}%` : "—"}
              </TableCell>
              <TableCell className={cn("text-right text-sm", c.rtoRate > 0 && "text-red-600 font-medium")}>
                {c.rtoRate}%
              </TableCell>
              <TableCell className="text-right text-sm">
                {c.avgDeliveryDays != null ? `${c.avgDeliveryDays}d` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
