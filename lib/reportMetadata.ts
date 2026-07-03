/**
 * Report Authorization Metadata
 * 
 * Single source of truth for all report RBAC requirements.
 * This metadata is consumed by useReportAuthorization hook to enforce
 * consistent authorization across all report pages.
 */

export interface ReportAuthMetadata {
  reportId: string
  requiredRole?: ('admin' | 'super_admin' | 'system_owner')[]
  requiredFeature?: string | string[]
  financialAdminOnly?: boolean
  systemOwnerOnly?: boolean
  superAdminPlusOnly?: boolean
}

export const REPORT_AUTH_METADATA: Record<string, ReportAuthMetadata> = {
  // ─── Revenue Reports ────────────────────────────────────────────────────────
  'total-order-summary': {
    reportId: 'total-order-summary',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },
  'order-summary': {
    reportId: 'order-summary',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },
  'event-ticket-sales': {
    reportId: 'event-ticket-sales',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },
  'event-ticket-refunds': {
    reportId: 'event-ticket-refunds',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },
  'merchandise-sales': {
    reportId: 'merchandise-sales',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'merchandise',
    financialAdminOnly: true,
  },
  'merchandise-refunds': {
    reportId: 'merchandise-refunds',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'merchandise',
    financialAdminOnly: true,
  },
  'best-seller': {
    reportId: 'best-seller',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'merchandise',
    financialAdminOnly: true,
  },
  'inventory': {
    reportId: 'inventory',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'merchandise',
    financialAdminOnly: true,
  },
  'external-tickets': {
    reportId: 'external-tickets',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },
  'refund-log': {
    reportId: 'refund-log',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },

  // ─── Membership / Lifecycle Reports ─────────────────────────────────────────
  'member-directory': {
    reportId: 'member-directory',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },
  'membership-growth': {
    reportId: 'membership-growth',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },
  'membership-purchases': {
    reportId: 'membership-purchases',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    financialAdminOnly: true,
  },
  'membership-renewals': {
    reportId: 'membership-renewals',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },
  'membership-expiry': {
    reportId: 'membership-expiry',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },

  // ─── Events Reports ─────────────────────────────────────────────────────────
  'event-passes-scanned': {
    reportId: 'event-passes-scanned',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },

  // ─── Governance Reports ─────────────────────────────────────────────────────
  'admin-audit': {
    reportId: 'admin-audit',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },
  'feature-selector': {
    reportId: 'feature-selector',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    systemOwnerOnly: true,
  },
  'elevate-demote': {
    reportId: 'elevate-demote',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },
  'super-admin-audit-log': {
    reportId: 'super-admin-audit-log',
    requiredRole: ['super_admin', 'system_owner'],
    superAdminPlusOnly: true,
  },

  // ─── Logistics Reports ──────────────────────────────────────────────────────
  'pickup-delivery': {
    reportId: 'pickup-delivery',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'merchandise',
    financialAdminOnly: true,
  },
  'rto': {
    reportId: 'rto',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'merchandise',
    financialAdminOnly: true,
  },

  // ─── Billing Reports ────────────────────────────────────────────────────────
  'subscription-billing': {
    reportId: 'subscription-billing',
    requiredRole: ['super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    superAdminPlusOnly: true,
  },
  'whatsapp-billing': {
    reportId: 'whatsapp-billing',
    requiredRole: ['super_admin', 'system_owner'],
    requiredFeature: 'reporting',
    superAdminPlusOnly: true,
  },

  // ─── Platform Analytics Reports ────────────────────────────────────────────
  'reward-points-granted': {
    reportId: 'reward-points-granted',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },
  'reward-points-redemption': {
    reportId: 'reward-points-redemption',
    requiredRole: ['admin', 'super_admin', 'system_owner'],
    requiredFeature: 'reporting',
  },

  // ─── Ads / Monetization Reports ─────────────────────────────────────────────
  'ads-generated-vs-money': {
    reportId: 'ads-generated-vs-money',
    requiredRole: ['system_owner'],
    requiredFeature: 'reporting',
    systemOwnerOnly: true,
  },
  'ads-performance': {
    reportId: 'ads-performance',
    requiredRole: ['system_owner'],
    requiredFeature: 'reporting',
    systemOwnerOnly: true,
  },
  'ads-config': {
    reportId: 'ads-config',
    requiredRole: ['system_owner'],
    requiredFeature: 'reporting',
    systemOwnerOnly: true,
  },
}
