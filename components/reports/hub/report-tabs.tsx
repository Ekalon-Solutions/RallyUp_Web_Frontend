"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

// Each sub-report is the existing standalone report page, rendered inline under
// the hub's tab. Its ReportShell switches to embedded layout via context.
const page = (load: () => Promise<{ default: ComponentType }>) =>
  dynamic(load, { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-[var(--ra-line)]" /> })

export interface SubReport {
  id: string
  label: string
  Component: ComponentType
}

export type TabId = "revenue" | "events" | "membership" | "logistics" | "platform" | "governance" | "billing"

export interface ReportTab {
  id: TabId
  label: string
  title: string
  description: string
  /** Show the embedded report's own summary cards between pills and table */
  showSummary?: boolean
  reports: SubReport[]
}

export const REPORT_TABS: ReportTab[] = [
  {
    id: "revenue",
    label: "Revenue",
    title: "Revenue & Commerce",
    description: "Merchandise sales, refunds, best sellers, inventory and external ticketing — everything that moves money through the club store.",
    reports: [
      { id: "total-order-summary", label: "Merchandise Sales / Orders", Component: page(() => import("@/app/dashboard/reports/total-order-summary/page")) },
      { id: "merchandise-refunds", label: "Merchandise Refunds", Component: page(() => import("@/app/dashboard/reports/merchandise-refunds/page")) },
      { id: "best-seller", label: "Featured Product Sales", Component: page(() => import("@/app/dashboard/reports/best-seller/page")) },
      { id: "inventory", label: "Inventory Report", Component: page(() => import("@/app/dashboard/reports/inventory/page")) },
      { id: "external-tickets", label: "External Ticket Report", Component: page(() => import("@/app/dashboard/reports/external-tickets/page")) },
      { id: "refund-log", label: "Overall Refund Log", Component: page(() => import("@/app/dashboard/reports/refund-log/page")) },
    ],
  },
  {
    id: "events",
    label: "Events",
    title: "Events",
    description: "Ticket sales, refunds and gate scans across every fixture and club event.",
    showSummary: true,
    reports: [
      { id: "event-ticket-sales", label: "Event Ticket Sales", Component: page(() => import("@/app/dashboard/reports/event-ticket-sales/page")) },
      { id: "event-ticket-refunds", label: "Event Ticket Refunds", Component: page(() => import("@/app/dashboard/reports/event-ticket-refunds/page")) },
      { id: "event-passes-scanned", label: "Event Passes Scanned", Component: page(() => import("@/app/dashboard/reports/event-passes-scanned/page")) },
    ],
  },
  {
    id: "membership",
    label: "Membership",
    title: "Member Lifecycle & Growth",
    description: "Who joined, who renewed and who lapsed — the full membership roster with plan-level purchase history.",
    reports: [
      { id: "member-directory", label: "Member Directory", Component: page(() => import("@/app/dashboard/reports/member-directory/page")) },
      { id: "membership-growth", label: "Membership Growth", Component: page(() => import("@/app/dashboard/reports/membership-growth/page")) },
      { id: "membership-purchases", label: "Membership Purchases", Component: page(() => import("@/app/dashboard/reports/membership-purchases/page")) },
      { id: "membership-renewals", label: "Membership Renewals", Component: page(() => import("@/app/dashboard/reports/membership-renewals/page")) },
    ],
  },
  {
    id: "logistics",
    label: "Logistics",
    title: "Logistics & Fulfillment",
    description: "Shipment status, courier performance and return-to-origin cost for every merchandise order.",
    reports: [
      { id: "pickup-delivery", label: "Pickup & Delivery", Component: page(() => import("@/app/dashboard/reports/pickup-delivery/page")) },
      { id: "rto", label: "RTO (Return to Origin)", Component: page(() => import("@/app/dashboard/reports/rto/page")) },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    title: "Platform & Loyalty Points",
    description: "Reward points earned and redeemed by members, and the discount value they unlocked.",
    reports: [
      { id: "reward-points-granted", label: "Points Accumulation", Component: page(() => import("@/app/dashboard/reports/reward-points-granted/page")) },
      { id: "reward-points-redemption", label: "Points Redemption", Component: page(() => import("@/app/dashboard/reports/reward-points-redemption/page")) },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    title: "Governance & Security",
    description: "Every admin action, role change and feature toggle — with actor, timestamp and risk level.",
    reports: [
      { id: "admin-audit", label: "Admin Audit Log", Component: page(() => import("@/app/dashboard/reports/admin-audit/page")) },
      { id: "elevate-demote", label: "Elevate / Demote Log", Component: page(() => import("@/app/dashboard/reports/elevate-demote/page")) },
      { id: "feature-selector", label: "Feature Selector Audit", Component: page(() => import("@/app/dashboard/reports/feature-selector/page")) },
      { id: "super-admin-audit-log", label: "Super Admin Audit Log", Component: page(() => import("@/app/dashboard/reports/super-admin-audit-log/page")) },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    title: "Billing",
    description: "Platform subscription invoices and WhatsApp messaging charges billed to the club.",
    reports: [
      { id: "subscription-billing", label: "Subscription Billing", Component: page(() => import("@/app/dashboard/reports/subscription-billing/page")) },
      { id: "whatsapp-billing", label: "WhatsApp Billing", Component: page(() => import("@/app/dashboard/reports/whatsapp-billing/page")) },
    ],
  },
]
