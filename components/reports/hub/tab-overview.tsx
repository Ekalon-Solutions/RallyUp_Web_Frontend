"use client"

import { useEffect, useState } from "react"
import { apiClient, type ApiResponse } from "@/lib/api"
import type { TabId } from "./report-tabs"
import {
  BarList, ChartSection, Donut, Heatmap, KpiStrip, StackedBars, TrendLines,
  inr, inrShort, monthBuckets, monthKey, num, pct, MONTHS_BACK, type BarItem, type Kpi,
} from "./viz"

type Params = Record<string, any>
type Fetcher = (p: Params) => Promise<ApiResponse>

/** Reports each tab's overview reads. The table below still pages through the full data. */
const FETCHERS: Partial<Record<string, Fetcher>> = {
  "total-order-summary": (p) => apiClient.getTotalOrderSummaryReport(p),
  "merchandise-refunds": (p) => apiClient.getMerchandiseRefundsReport(p),
  inventory: (p) => apiClient.getInventoryReport(p),
  "event-ticket-sales": (p) => apiClient.getEventTicketSalesReport(p),
  "event-passes-scanned": (p) => apiClient.getEventPassesScannedReport(p),
  "event-ticket-refunds": (p) => apiClient.getEventTicketRefundsReport(p),
  "membership-growth": (p) => apiClient.getMembershipGrowthReport(p),
  "membership-purchases": (p) => apiClient.getMembershipPurchaseReport(p),
  "member-directory": (p) => apiClient.getMemberDirectoryReport(p),
  "membership-renewals": (p) => apiClient.getMembershipRenewalReport(p),
  "pickup-delivery": (p) => apiClient.getPickupDeliveryReport(p),
  rto: (p) => apiClient.getRTOReport(p),
  "reward-points-granted": (p) => apiClient.getRewardPointsGrantedReport(p),
  "reward-points-redemption": (p) => apiClient.getRewardPointsRedemptionReport(p),
  "admin-audit": (p) => apiClient.getAdminAuditLogReport(p),
  "elevate-demote": (p) => apiClient.getElevateDemoteLogReport(p),
  "subscription-billing": (p) => apiClient.getSubscriptionBillingReport(p),
  "whatsapp-billing": (p) => apiClient.getWhatsAppBillingReport(p),
}

const TAB_SOURCES: Record<TabId, string[]> = {
  revenue: ["total-order-summary", "merchandise-refunds", "inventory"],
  events: ["event-ticket-sales", "event-passes-scanned", "event-ticket-refunds"],
  membership: ["membership-growth", "membership-purchases", "member-directory", "membership-renewals"],
  logistics: ["pickup-delivery", "rto"],
  platform: ["reward-points-granted", "reward-points-redemption"],
  governance: ["admin-audit", "elevate-demote"],
  billing: ["subscription-billing", "whatsapp-billing"],
}

type Row = Record<string, any>
interface Source { summary: Row; rows: Row[] }
type Sources = Record<string, Source>

export function overviewStartDate() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function useSources(tab: TabId, accessible: Set<string>, scope: Params): { data: Sources; loading: boolean } {
  const [state, setState] = useState<{ data: Sources; loading: boolean }>({ data: {}, loading: true })
  const scopeKey = JSON.stringify(scope)
  useEffect(() => {
    let cancelled = false
    const ids = TAB_SOURCES[tab].filter((id) => accessible.has(id))
    setState({ data: {}, loading: true })
    // ponytail: charts aggregate the newest 200 rows (backend maxLimit); add a monthly
    // aggregate endpoint if a club regularly exceeds that in 12 months.
    const params = { ...scope, page: 1, limit: 200, startDate: overviewStartDate() }
    Promise.all(
      ids.map(async (id) => {
        const res = await FETCHERS[id]!(params).catch(() => null)
        const body = res?.success ? res.data : null
        return [id, { summary: body?.summary ?? {}, rows: Array.isArray(body?.data) ? body.data : [] }] as const
      }),
    ).then((entries) => !cancelled && setState({ data: Object.fromEntries(entries), loading: false }))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, scopeKey, accessible])
  return state
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const n = (v: unknown) => Number(v) || 0
const S = (d: Sources, id: string) => d[id] ?? { summary: {}, rows: [] }
const pretty = (s: string) => (s || "Unknown").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bRto\b/g, "RTO")

/** Sum `value(row)` into month buckets keyed by `date(row)`. */
function byMonth(rows: Row[], date: (r: Row) => string | null | undefined, value: (r: Row) => number = () => 1) {
  const out: Record<string, number> = {}
  for (const r of rows) {
    const k = monthKey(date(r))
    if (k) out[k] = (out[k] ?? 0) + value(r)
  }
  return out
}

function series(cols: Record<string, Record<string, number>>) {
  return monthBuckets().map(({ key, label }) => {
    const row: Record<string, string | number> = { label }
    for (const [name, m] of Object.entries(cols)) row[name] = m[key] ?? 0
    return row
  })
}

function topN(rows: Row[], label: (r: Row) => string, value: (r: Row) => number, limit = 5) {
  const agg: Record<string, number> = {}
  for (const r of rows) agg[label(r)] = (agg[label(r)] ?? 0) + value(r)
  return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, limit)
}

const INK = "var(--ra-ink)"
const MID = "var(--ra-mid)"
const ACCENT = "var(--ra-accent)"

// ─── Tab views ────────────────────────────────────────────────────────────────

function build(tab: TabId, d: Sources): { kpis: Kpi[]; body: React.ReactNode } {
  switch (tab) {
    case "revenue": {
      const o = S(d, "total-order-summary"), r = S(d, "merchandise-refunds"), inv = S(d, "inventory")
      const paid = o.rows.filter((x) => x.paymentStatus === "paid")
      const inventory: BarItem[] = topN(inv.rows, (x) => x.category || "Uncategorised", (x) => n(x.availableStock), 4).map(([label, available]) => {
        const rows = inv.rows.filter((x) => (x.category || "Uncategorised") === label)
        const current = rows.reduce((s, x) => s + n(x.currentStock), 0)
        const low = rows.filter((x) => x.lowStockIndicator || x.outOfStockIndicator).length
        return { label, value: available, display: `${num(available)} / ${num(current)} units`, note: low ? `${low} SKU${low > 1 ? "s" : ""} low or out of stock` : `${rows.length} SKU${rows.length > 1 ? "s" : ""} healthy`, alert: low > 0 }
      })
      return {
        kpis: [
          { label: "Gross merchandise sales", value: inr(n(o.summary.grossRevenue)), sub: `${num(n(o.summary.totalOrders))} orders · AOV ${inr(n(o.summary.averageOrderValue))}` },
          { label: "Net revenue", value: inr(n(o.summary.netRevenue)), sub: `${num(n(o.summary.paidOrders))} paid · ${num(n(o.summary.cancelledOrders))} cancelled` },
          { label: "Refunds issued", value: inr(n(r.summary.refundAmount)), sub: `${num(n(r.summary.totalRefunds))} refunds · ${num(n(r.summary.pendingRefunds))} pending` },
          { label: "Low stock", value: `${num(n(inv.summary.lowStockProducts))} SKUs`, sub: `${num(n(inv.summary.outOfStockProducts))} out of stock — restock needed`, alert: n(inv.summary.lowStockProducts) + n(inv.summary.outOfStockProducts) > 0 },
        ],
        body: (
          <ChartSection
            title="Merchandise sales by month"
            subtitle="Paid store orders, split by members and non-members. Labels show the monthly total."
            legend={[{ label: "Members", color: INK }, { label: "Non-members", color: MID }]}
            aside={<BarList title="Inventory availability" meta="available / on hand" items={inventory} empty="No products in inventory" />}
          >
            <StackedBars
              format={inrShort}
              series={[{ key: "members", label: "Members", color: INK }, { key: "others", label: "Non-members", color: MID }]}
              data={series({
                members: byMonth(paid.filter((x) => x.isMember), (x) => x.orderDate, (x) => n(x.totalAmount)),
                others: byMonth(paid.filter((x) => !x.isMember), (x) => x.orderDate, (x) => n(x.totalAmount)),
              })}
            />
          </ChartSection>
        ),
      }
    }

    case "events": {
      const s = S(d, "event-ticket-sales"), p = S(d, "event-passes-scanned"), r = S(d, "event-ticket-refunds")
      const top = topN(s.rows, (x) => x.eventTitle || "Untitled event", (x) => n(x.tickets))
      return {
        kpis: [
          { label: "Tickets sold", value: num(n(s.summary.ticketsSold)), sub: `${num(n(p.summary.totalScanned))} passes scanned at the gate` },
          { label: "Attendance rate", value: pct(n(p.summary.attendanceRate)), sub: "scanned ÷ sold" },
          { label: "Ticket revenue", value: inr(n(s.summary.grossRevenue)), sub: `Net ${inr(n(s.summary.netRevenue))} after ${inr(n(s.summary.totalDiscounts))} discounts` },
          { label: "No-show rate", value: pct(n(p.summary.noShowRate)), sub: `${num(n(r.summary.totalRefunds))} refunds · ${inr(n(r.summary.totalRefundedAmount))}`, alert: true },
        ],
        body: (
          <ChartSection
            title="Tickets sold vs passes scanned by month"
            subtitle="Sold counts use the registration date; scans use the gate scan time."
            legend={[{ label: "Tickets sold", color: INK }, { label: "Passes scanned", color: MID }]}
            aside={<BarList title="Top events" meta="tickets sold" items={top.map(([label, v]) => ({ label, value: v, display: num(v) }))} empty="No ticket sales yet" />}
          >
            <TrendLines
              series={[{ key: "sold", label: "Tickets sold", color: INK }, { key: "scanned", label: "Passes scanned", color: MID }]}
              data={series({
                sold: byMonth(s.rows, (x) => x.registrationDate, (x) => n(x.tickets) || 1),
                scanned: byMonth(p.rows.filter((x) => x.scannedAt), (x) => x.scannedAt),
              })}
            />
          </ChartSection>
        ),
      }
    }

    case "membership": {
      const g = S(d, "membership-growth"), pu = S(d, "membership-purchases"), dir = S(d, "member-directory"), re = S(d, "membership-renewals")
      const now = new Date().toISOString()
      return {
        kpis: [
          { label: "Total members", value: num(n(dir.summary.totalMembers)), sub: `${num(n(dir.summary.activeMembers))} active · net growth ${n(g.summary.netGrowth) >= 0 ? "+" : ""}${num(n(g.summary.netGrowth))}` },
          { label: "Membership revenue", value: inr(n(pu.summary.membershipRevenue)), sub: `${num(n(pu.summary.membershipPurchases))} purchases · avg ${inr(n(pu.summary.averageMembershipValue))}` },
          { label: "Renewal rate", value: pct(n(re.summary.renewalRate)), sub: `${num(n(re.summary.expiringSoon))} expiring soon` },
          { label: "Lapsed", value: num(n(g.summary.expiredMemberships)), sub: "memberships expired without renewal", alert: true },
        ],
        body: (
          <ChartSection
            title="New joiners, renewals and lapses by month"
            subtitle="Joiners by join date, renewals by renewal date, lapses by expiry date."
            legend={[{ label: "New joiners", color: INK }, { label: "Renewals", color: MID }, { label: "Lapses", color: ACCENT }]}
          >
            <TrendLines
              series={[{ key: "joined", label: "New joiners", color: INK }, { key: "renewed", label: "Renewals", color: MID }, { key: "lapsed", label: "Lapses", color: ACCENT }]}
              data={series({
                joined: byMonth(g.rows, (x) => x.joinedDate),
                renewed: byMonth(g.rows.filter((x) => x.renewalDate), (x) => x.renewalDate),
                lapsed: byMonth(g.rows.filter((x) => x.expiryDate && x.expiryDate < now && x.status !== "active"), (x) => x.expiryDate),
              })}
            />
          </ChartSection>
        ),
      }
    }

    case "logistics": {
      const pd = S(d, "pickup-delivery"), rto = S(d, "rto")
      const total = n(pd.summary.totalOrders)
      const delivered = pd.rows.filter((x) => x.shippedDate && x.deliveredDate)
      const avgDays = delivered.length
        ? delivered.reduce((s, x) => s + (new Date(x.deliveredDate).getTime() - new Date(x.shippedDate).getTime()) / 864e5, 0) / delivered.length
        : 0
      const palette = [INK, MID, "var(--ra-soft)", "#B5AFA3"]
      const mix = topN(pd.rows, (x) => pretty(x.deliveryStatus), () => 1, 6).map(([label, value], i) => ({
        label, value, color: /rto|fail|cancel|return/i.test(label) ? ACCENT : palette[i % palette.length],
      }))
      const couriers = topN(pd.rows, (x) => x.courierName || "Unassigned", () => 1, 6).map(([name, count]) => {
        const rows = pd.rows.filter((x) => (x.courierName || "Unassigned") === name)
        const done = rows.filter((x) => x.deliveredDate).length
        return { name, count, done, rto: rows.filter((x) => /rto/i.test(x.deliveryStatus || "")).length }
      })
      return {
        kpis: [
          { label: "Shipments", value: num(total), sub: `${num(n(pd.summary.outForDeliveryCount))} out for delivery` },
          { label: "Avg. delivery time", value: `${avgDays.toFixed(1)} days`, sub: "shipped → delivered" },
          { label: "Delivery success", value: pct(total ? (n(pd.summary.deliveredCount) / total) * 100 : 0), sub: `${num(n(pd.summary.deliveredCount))} delivered` },
          { label: "RTO rate", value: pct(total ? (n(pd.summary.rtoCount) / total) * 100 : 0), sub: `${num(n(pd.summary.rtoCount))} returned · ${inr(n(rto.summary.totalRTOCharges))} charges`, alert: true },
        ],
        body: (
          <div className="space-y-6">
            <ChartSection title="Delivery status mix" subtitle="Share of shipments in each delivery state.">
              <Donut items={mix} centerLabel="shipments" />
            </ChartSection>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--ra-line)] text-left text-[11px] uppercase tracking-wide text-[var(--ra-mid)]">
                    <th className="py-2 font-medium">Courier</th>
                    <th className="py-2 font-medium text-right">Shipments</th>
                    <th className="py-2 font-medium text-right">Delivered</th>
                    <th className="py-2 font-medium text-right">RTO</th>
                  </tr>
                </thead>
                <tbody>
                  {couriers.map((c) => (
                    <tr key={c.name} className="border-b border-[var(--ra-line)]">
                      <td className="py-2.5 font-medium text-[var(--ra-ink)]">{c.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{num(c.count)}</td>
                      <td className="py-2.5 text-right tabular-nums">{pct((c.done / c.count) * 100)}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--ra-accent)]">{num(c.rto)}</td>
                    </tr>
                  ))}
                  {couriers.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-xs text-[var(--ra-mid)]">No shipments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ),
      }
    }

    case "platform": {
      const gr = S(d, "reward-points-granted"), rd = S(d, "reward-points-redemption")
      const granted = n(gr.summary.totalPointsGranted), redeemed = n(rd.summary.totalPointsRedeemed)
      const sources: BarItem[] = [
        { label: "Event attendance", value: n(gr.summary.pointsByAttendance) },
        { label: "Manual adjustments", value: n(gr.summary.pointsByAdjustment) },
        { label: "Other sources", value: n(gr.summary.pointsByOther) },
      ].map((x) => ({ ...x, display: `${num(x.value)} pts`, note: granted ? `${pct((x.value / granted) * 100)} of granted` : undefined }))
      return {
        kpis: [
          { label: "Points granted", value: `${num(granted)} pts`, sub: `${num(n(gr.summary.totalTransactions))} transactions` },
          { label: "Redemption rate", value: pct(granted ? (redeemed / granted) * 100 : 0), sub: `${num(redeemed)} pts redeemed` },
          { label: "Discount unlocked", value: inr(n(rd.summary.totalDiscountValue)), sub: `${num(n(rd.summary.totalRedemptions))} redemptions` },
          { label: "Members earning", value: num(n(gr.summary.uniqueMembers)), sub: `${num(n(rd.summary.expiredReservations))} reservations expired`, alert: true },
        ],
        body: (
          <ChartSection
            title="Points granted vs redeemed by month"
            legend={[{ label: "Granted", color: INK }, { label: "Redeemed", color: MID }]}
            aside={<BarList title="Points by source" meta="all time in range" items={sources} />}
          >
            <TrendLines
              area
              series={[{ key: "granted", label: "Granted", color: INK }, { key: "redeemed", label: "Redeemed", color: MID }]}
              data={series({
                granted: byMonth(gr.rows, (x) => x.timestamp, (x) => n(x.points)),
                redeemed: byMonth(rd.rows, (x) => x.timestamp, (x) => n(x.pointsReserved)),
              })}
            />
          </ChartSection>
        ),
      }
    }

    case "governance": {
      const a = S(d, "admin-audit"), e = S(d, "elevate-demote")
      const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[])
      for (const r of a.rows) {
        const t = new Date(r.timestamp)
        if (!isNaN(t.getTime())) grid[(t.getDay() + 6) % 7][t.getHours()]++
      }
      const top = topN(a.rows, (x) => pretty(x.action), () => 1)
      return {
        kpis: [
          { label: "Admin actions", value: num(n(a.summary.totalActions)), sub: "logged in the last 12 months" },
          { label: "Unique admins", value: num(n(a.summary.uniqueAdmins)), sub: "with at least one action" },
          { label: "Role changes", value: num(n(e.summary.totalChanges)), sub: `${num(n(e.summary.promotions))} promotions · ${num(n(e.summary.demotions))} demotions` },
          { label: "High-risk actions", value: num(n(a.summary.highRiskActions)), sub: `${num(n(a.summary.criticalActions))} critical — review recommended`, alert: true },
        ],
        body: (
          <ChartSection
            title="Admin activity by day and time"
            subtitle="Darker cells mean more admin actions in that hour (your local time)."
            aside={<BarList title="Most frequent actions" meta="count" items={top.map(([label, v]) => ({ label, value: v, display: num(v) }))} empty="No admin activity yet" />}
          >
            <Heatmap grid={grid} />
          </ChartSection>
        ),
      }
    }

    case "billing": {
      const sub = S(d, "subscription-billing"), wa = S(d, "whatsapp-billing")
      const base = sub.rows.reduce((s, x) => s + n(x.baseTierAmount), 0)
      const addons = sub.rows.reduce((s, x) => s + n(x.addonsAmount), 0)
      const waTotal = n(wa.summary.totalAmount)
      return {
        kpis: [
          { label: "Total billed", value: inr(n(sub.summary.totalBilledAmount) + waTotal), sub: `${num(n(sub.summary.totalInvoices) + n(wa.summary.totalInvoices))} invoices · ${inr(n(sub.summary.pendingAmount))} pending` },
          { label: "WhatsApp usage", value: `${num(n(wa.summary.totalMessagesSent))} msgs`, sub: `${inr(waTotal)} incl. GST` },
        ],
        body: (
          <ChartSection
            title="Subscription & WhatsApp billing by month"
            legend={[{ label: "Subscription", color: INK }, { label: "WhatsApp", color: MID }]}
            aside={
              <BarList
                title="Billing breakdown"
                meta="in range"
                items={[
                  { label: "Base tier", value: base, display: inr(base) },
                  { label: "Add-ons", value: addons, display: inr(addons) },
                  { label: "WhatsApp messaging", value: waTotal, display: inr(waTotal) },
                  { label: "Pending payment", value: n(sub.summary.pendingAmount), display: inr(n(sub.summary.pendingAmount)), alert: n(sub.summary.pendingAmount) > 0 },
                ]}
              />
            }
          >
            <StackedBars
              format={inrShort}
              series={[{ key: "subscription", label: "Subscription", color: INK }, { key: "whatsapp", label: "WhatsApp", color: MID }]}
              data={series({
                subscription: byMonth(sub.rows, (x) => x.createdAt, (x) => n(x.totalAmount)),
                whatsapp: byMonth(wa.rows, (x) => x.periodStart, (x) => n(x.totalAmount)),
              })}
            />
          </ChartSection>
        ),
      }
    }
  }
}

export function TabOverview({ tab, accessible, scope }: { tab: TabId; accessible: Set<string>; scope: Params }) {
  const { data, loading } = useSources(tab, accessible, scope)
  const { kpis, body } = build(tab, data)
  return (
    <div className="space-y-8">
      <KpiStrip kpis={kpis} loading={loading} />
      <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>{body}</div>
    </div>
  )
}
