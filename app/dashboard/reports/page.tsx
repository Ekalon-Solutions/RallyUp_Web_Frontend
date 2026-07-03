"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { useSystemOwnerReportScope } from "@/hooks/useSystemOwnerReportScope"
import { SystemOwnerClubFilter } from "@/components/reports/SystemOwnerClubFilter"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { getEffectiveAdminRole } from "@/lib/adminPermissions"
import { authorizeReportAccess } from "@/hooks/useReportAuthorization"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  FileBarChart,
  Users,
  CreditCard,
  DollarSign,
  Shield,
  Package,
  Truck,
  Gift,
  Coins,
  PackageX,
  ShieldAlert,
  Ticket,
  ExternalLink,
  ShoppingCart,
  RotateCcw,
  Receipt,
  MessageSquare,
  BarChart3,
  UserPlus,
  TrendingUp,
  Calendar,
  Grid3X3,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Report Definitions ────────────────────────────────────────────────────────

interface ReportDefinition {
  id: string
  name: string
  description: string
  category: string
  href: string
  icon: React.ElementType
  badge?: string
}

const ALL_REPORTS: ReportDefinition[] = [
  // ─── Revenue Reports ────────────────────────────────────────────────────
  {
    id: "total-order-summary",
    name: "Total Order Summary",
    description: "Comprehensive order breakdown with revenue, order status, payment methods, and customer analytics.",
    category: "Revenue",
    href: "/dashboard/reports/total-order-summary",
    icon: ShoppingCart,
  },
  {
    id: "event-ticket-sales",
    name: "Event Ticket Sales",
    description: "Event registration revenue with ticket tiers, pricing, registrations, and capacity utilization.",
    category: "Revenue",
    href: "/dashboard/reports/event-ticket-sales",
    icon: Ticket,
  },
  {
    id: "event-ticket-refunds",
    name: "Event Ticket Refunds",
    description: "Event cancellation and refund tracking with refund amounts, methods, and customer details.",
    category: "Revenue",
    href: "/dashboard/reports/event-ticket-refunds",
    icon: RotateCcw,
  },
  {
    id: "merchandise-sales",
    name: "Merchandise Sales",
    description: "Store product performance with units sold, revenue, SKU-level breakdown, and inventory turnover.",
    category: "Revenue",
    href: "/dashboard/reports/merchandise-sales",
    icon: Package,
  },
  {
    id: "merchandise-refunds",
    name: "Merchandise Refunds",
    description: "Store order returns with refund status, returned quantities, and product-wise breakdown.",
    category: "Revenue",
    href: "/dashboard/reports/merchandise-refunds",
    icon: RotateCcw,
  },
  {
    id: "best-seller",
    name: "Best Seller Report",
    description: "Ranking of merchandise products and ticketed events by units sold and revenue generated.",
    category: "Revenue",
    href: "/dashboard/reports/best-seller",
    icon: Target,
  },
  {
    id: "inventory",
    name: "Inventory Report",
    description: "Current merchandise stock, reserved stock, available stock, and low-stock indicators.",
    category: "Revenue",
    href: "/dashboard/reports/inventory",
    icon: Package,
  },
  {
    id: "external-tickets",
    name: "External Ticket Report",
    description: "Third-party ticketing requests with approval status, event details, and applicant information.",
    category: "Revenue",
    href: "/dashboard/reports/external-tickets",
    icon: ExternalLink,
  },
  {
    id: "refund-log",
    name: "Refund Log",
    description: "Unified refund audit trail across all revenue streams with amounts, methods, and timestamps.",
    category: "Revenue",
    href: "/dashboard/reports/refund-log",
    icon: RotateCcw,
  },

  // ─── Membership / Lifecycle Reports ─────────────────────────────────────
  {
    id: "member-directory",
    name: "Member Directory",
    description: "Complete membership roster with plans, status, contact details, and renewal dates.",
    category: "Membership",
    href: "/dashboard/reports/member-directory",
    icon: Users,
  },
  {
    id: "membership-growth",
    name: "Membership Growth",
    description: "New member registrations, renewals, expired memberships, and net growth metrics over time.",
    category: "Membership",
    href: "/dashboard/reports/membership-growth",
    icon: TrendingUp,
  },
  {
    id: "membership-purchases",
    name: "Membership Purchases",
    description: "Paid membership acquisition with revenue, plan selection, and payment method breakdown.",
    category: "Membership",
    href: "/dashboard/reports/membership-purchases",
    icon: CreditCard,
  },
  {
    id: "membership-renewals",
    name: "Membership Renewals",
    description: "Renewal activity tracking with renewal rates, lapse rates, and retention metrics.",
    category: "Membership",
    href: "/dashboard/reports/membership-renewals",
    icon: Calendar,
  },
  {
    id: "membership-expiry",
    name: "Membership Expiry",
    description: "Upcoming membership expirations, days remaining, renewal rates, and churn risk levels.",
    category: "Membership",
    href: "/dashboard/reports/membership-expiry",
    icon: Calendar,
  },

  // ─── Events Reports ─────────────────────────────────────────────────────
  {
    id: "event-passes-scanned",
    name: "Event Passes Scanned",
    description: "Attendance tracking with scan timestamps, vendor activity, and check-in rates.",
    category: "Events",
    href: "/dashboard/reports/event-passes-scanned",
    icon: Ticket,
  },

  // ─── Governance Reports ─────────────────────────────────────────────────
  {
    id: "admin-audit",
    name: "Admin Audit Log",
    description: "Administrative action tracking with actor details, timestamps, risk levels, and IP addresses.",
    category: "Governance",
    href: "/dashboard/reports/admin-audit",
    icon: Shield,
  },
  {
    id: "feature-selector",
    name: "Feature Selector Audit",
    description: "Feature configuration changes with actor details, old/new values, and reason codes.",
    category: "Governance",
    href: "/dashboard/reports/feature-selector",
    icon: Grid3X3,
  },
  {
    id: "elevate-demote",
    name: "Elevate / Demote Log",
    description: "Administrative promotions, role demotions, privilege escalations, and permission changes.",
    category: "Governance",
    href: "/dashboard/reports/elevate-demote",
    icon: UserPlus,
  },
  {
    id: "super-admin-audit-log",
    name: "Super Admin Audit Log",
    description: "Cross-tenant audit trail for system owner actions and critical operations.",
    category: "Governance",
    href: "/dashboard/reports/super-admin-audit-log",
    icon: ShieldAlert,
    badge: "Super Admin",
  },

  // ─── Logistics Reports ──────────────────────────────────────────────────
  {
    id: "pickup-delivery",
    name: "Pickup & Delivery",
    description: "Shipment fulfillment status, courier performance, AWB tracking codes, and delivery timelines.",
    category: "Logistics",
    href: "/dashboard/reports/pickup-delivery",
    icon: Truck,
  },
  {
    id: "rto",
    name: "RTO (Return to Origin)",
    description: "Failed delivery tracking with courier performance, RTO charges, and timeline analysis.",
    category: "Platform",
    href: "/dashboard/reports/rto",
    icon: PackageX,
  },

  // ─── Billing Reports ────────────────────────────────────────────────────
  {
    id: "subscription-billing",
    name: "Subscription Billing",
    description: "Platform SaaS subscription invoices, tier changes, add-on charges, and settlement statuses.",
    category: "Billing",
    href: "/dashboard/reports/subscription-billing",
    icon: Receipt,
  },
  {
    id: "whatsapp-billing",
    name: "WhatsApp Billing",
    description: "WhatsApp messaging cost tracking with message volumes, credits, debits, and invoice history.",
    category: "Billing",
    href: "/dashboard/reports/whatsapp-billing",
    icon: MessageSquare,
  },

  // ─── Platform Analytics Reports ────────────────────────────────────────
  {
    id: "reward-points-granted",
    name: "Reward Points Granted",
    description: "Member-wise breakdown of loyalty points awarded through attendance, manual adjustments, and other sources.",
    category: "Platform",
    href: "/dashboard/reports/reward-points-granted",
    icon: Gift,
  },
  {
    id: "reward-points-redemption",
    name: "Reward Points Redemption",
    description: "Redemption history tracking points reserved, discount amounts, status changes, and balance impact.",
    category: "Platform",
    href: "/dashboard/reports/reward-points-redemption",
    icon: Coins,
  },

  // ─── Ads / Monetization Reports ─────────────────────────────────────────
  // ⚠️ NOTE: These reports require Ad Platform infrastructure (not yet implemented)
  // Frontend definitions included for completeness and future activation
  {
    id: "ads-generated-vs-money",
    name: "Ads Generated vs Money Earned",
    description: "ROI analysis of local sponsor and network ads with impression, click, and revenue tracking.",
    category: "Ads",
    href: "/dashboard/reports/ads-generated-vs-money",
    icon: DollarSign,
    badge: "System Owner",
  },
  {
    id: "ads-performance",
    name: "Ad Performance Report",
    description: "Impressions, clicks, CTR, conversions, and ROAS metrics for club-specific advertising campaigns.",
    category: "Ads",
    href: "/dashboard/reports/ads-performance",
    icon: BarChart3,
    badge: "System Owner",
  },
  {
    id: "ads-config",
    name: "Ads Configuration Report",
    description: "Configuration overview for ad placements, sponsor settings, and monetization controls.",
    category: "Ads",
    href: "/dashboard/reports/ads-config",
    icon: Grid3X3,
    badge: "System Owner",
  },
]

// ─── Category Metadata ──────────────────────────────────────────────────────────

interface CategoryMeta {
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  Revenue: {
    label: "Revenue",
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    description: "Sales, orders, refunds, and inventory analytics",
  },
  Membership: {
    label: "Membership",
    icon: Users,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    description: "Member lifecycle, growth, renewals, and expirations",
  },
  Events: {
    label: "Events",
    icon: Ticket,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    description: "Attendance tracking and event analytics",
  },
  Governance: {
    label: "Governance",
    icon: Shield,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    description: "Audit logs, permissions, and admin actions",
  },
  Logistics: {
    label: "Logistics",
    icon: Truck,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    description: "Shipment tracking and delivery analytics",
  },
  Billing: {
    label: "Billing",
    icon: Receipt,
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    description: "Subscription and platform billing reports",
  },
  Platform: {
    label: "Platform",
    icon: BarChart3,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    description: "Reward points, RTO, and platform analytics",
  },
  Ads: {
    label: "Ads & Monetization",
    icon: Target,
    color: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    description: "Advertising campaigns, ROI, and sponsor analytics",
  },
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ReportsHubPage() {
  const router = useRouter()
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()
  const activeClubId = isSystemOwner ? selectedClubId : clubId
  const { config: clubFeatureConfig } = useClubFeatures(activeClubId ?? null)

  const [searchQuery, setSearchQuery] = useState("")

  const effectiveRole = getEffectiveAdminRole(user, activeClubId)
  const canViewReportsHub = ["admin", "super_admin", "system_owner"].includes(effectiveRole)

  // ─── Unimplemented Reports (hidden from UI until ready) ────────────────────
  const UNIMPLEMENTED_REPORT_IDS = new Set([
    'ads-generated-vs-money',
    'ads-performance',
    'ads-config',
  ])

  // Filter reports based on user permissions
  const accessibleReports = useMemo(() => {
    // For System Owner: Use null clubId for authorization filtering
    // This ensures System Owners see all reports they have access to, regardless of selected club
    // The selected club only affects data scope within reports, not report visibility
    const authClubId = isSystemOwner ? null : activeClubId
    
    return ALL_REPORTS.filter((report) => {
      // Hide unimplemented reports from UI
      if (UNIMPLEMENTED_REPORT_IDS.has(report.id)) {
        return false
      }
      
      // Apply RBAC authorization
      return authorizeReportAccess(report.id, user, authClubId, clubFeatureConfig).authorized
    })
  }, [user, activeClubId, isSystemOwner, clubFeatureConfig])

  // Filter reports based on search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return accessibleReports

    const query = searchQuery.toLowerCase()
    return accessibleReports.filter(
      (report) =>
        report.name.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.category.toLowerCase().includes(query)
    )
  }, [accessibleReports, searchQuery])

  // Group reports by category
  const reportsByCategory = useMemo(() => {
    const groups: Record<string, ReportDefinition[]> = {}
    filteredReports.forEach((report) => {
      if (!groups[report.category]) {
        groups[report.category] = []
      }
      groups[report.category].push(report)
    })
    
    // Remove empty categories (e.g., Ads category when all its reports are hidden)
    Object.keys(groups).forEach((category) => {
      if (groups[category].length === 0) {
        delete groups[category]
      }
    })
    
    return groups
  }, [filteredReports])

  const categories = Object.keys(reportsByCategory).sort()

  if (!canViewReportsHub) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to view reports.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <FileBarChart className="w-8 h-8 text-primary" />
              Reports Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive analytics and insights across all platform modules.
              {accessibleReports.length > 0 && (
                <span className="ml-1 font-semibold text-primary">
                  ({accessibleReports.length} report{accessibleReports.length !== 1 ? "s" : ""} available)
                </span>
              )}
            </p>
          </div>

          {/* Club Scope Filter for System Owner */}
          {isSystemOwner && (
            <div className="flex items-center gap-4">
              <SystemOwnerClubFilter
                selectedClubId={selectedClubId}
                onChange={setSelectedClubId}
              />
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reports by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Report Cards by Category */}
        {categories.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <FileBarChart className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">No reports found</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "No reports are available with your current permissions"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const meta = CATEGORY_META[category] || {
                label: category,
                icon: FileBarChart,
                color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
                description: "",
              }
              const CategoryIcon = meta.icon

              return (
                <div key={category} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", meta.color)}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
                      {meta.description && (
                        <p className="text-sm text-muted-foreground">{meta.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {reportsByCategory[category].length} report
                      {reportsByCategory[category].length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Report Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportsByCategory[category].map((report) => {
                      const ReportIcon = report.icon
                      return (
                        <Card
                          key={report.id}
                          className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(report.href)}
                        >
                          <CardContent className="p-6 space-y-3">
                            {/* Icon & Badge */}
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <ReportIcon className="w-6 h-6 text-primary" />
                              </div>
                              {report.badge && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-0">
                                  {report.badge}
                                </Badge>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {report.name}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {report.description}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
