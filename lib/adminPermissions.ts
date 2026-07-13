/**
 * Admin Permission Utilities
 * 
 * Mirrors backend logic from src/middleware/financialAdminAuth.ts
 * to ensure frontend filtering matches backend enforcement.
 */

type AdminLike = {
  role?: string
  isVendor?: boolean
  club?: unknown
  clubs?: unknown[]
  superAdminClubIds?: string[]
  clubAdminContexts?: Array<{
    clubId?: unknown
    permissionsMatrix?: Record<string, any>
    permissions?: Record<string, boolean>
  }>
}

function resolveMatrix(context: NonNullable<AdminLike['clubAdminContexts']>[number]) {
  return context.permissionsMatrix || (context.permissions as any)?._matrix
}

function findAdminContext(user: AdminLike, clubId: string | null) {
  if (!clubId || !user.clubAdminContexts) return undefined

  return user.clubAdminContexts.find(
    (ctx) => ctx?.clubId && String(ctx.clubId) === String(clubId)
  )
}

export function getEffectiveAdminRole(
  user: AdminLike | null | undefined,
  clubId?: string | null
): string {
  if (!user) return 'member'
  if (user.role === 'system_owner') return 'system_owner'
  if (user.role === 'vendor' || user.isVendor) return 'vendor'
  if (user.role !== 'super_admin') return user.role || 'member'
  if (!clubId) return 'super_admin'

  const ids = user.superAdminClubIds ?? []
  return ids.map(String).includes(String(clubId)) ? 'super_admin' : 'admin'
}

export function adminHasReportingAccess(
  user: AdminLike | null | undefined,
  clubId: string | null
): boolean {
  if (!user) return false

  const effectiveRole = getEffectiveAdminRole(user, clubId)
  if (effectiveRole === 'super_admin' || effectiveRole === 'system_owner') {
    return true
  }

  if (effectiveRole !== 'admin') {
    return false
  }

  if (!user.clubAdminContexts || user.clubAdminContexts.length === 0) {
    return user.role !== 'super_admin'
  }

  const context = findAdminContext(user, clubId)
  if (!context) return false

  const matrix = resolveMatrix(context)
  if (matrix) {
    return Boolean(matrix.reporting?.view || matrix.reporting?.edit)
  }

  const flat = context.permissions || {}
  return Boolean(flat.reporting || flat.analytics)
}

/**
 * Checks if an admin has financial access based on their permission matrix.
 * 
 * Financial reports include:
 * - Total Order Summary
 * - Event Ticket Sales / Refunds
 * - Merchandise Sales / Refunds
 * - Best Seller / Inventory
 * - External Tickets
 * - Refund Log
 * - Membership Purchases
 * - Pickup & Delivery (Logistics)
 * - RTO Report
 * - Subscription Billing (Super Admin++)
 * - WhatsApp Billing (Super Admin++)
 * 
 * Access Rules:
 * 1. Super admins and system owners ALWAYS have financial access
 * 2. Legacy admins (no clubAdminContexts) have financial access for backwards compatibility
 * 3. Regular admins must have financial permissions in their permission matrix:
 *    - refunds.view OR refunds.edit
 *    - reporting.view OR reporting.edit
 *    - OR legacy flat permissions: refunds, analytics, reporting
 */
export function adminHasFinancialAccess(
  user: AdminLike | null | undefined,
  clubId: string | null
): boolean {
  if (!user) return false

  const effectiveRole = getEffectiveAdminRole(user, clubId)

  // Effective super admins and system owners always have financial access
  if (effectiveRole === 'super_admin' || effectiveRole === 'system_owner') {
    return true
  }

  // Non-admins don't have financial access
  if (effectiveRole !== 'admin') {
    return false
  }

  // Legacy admins (no clubAdminContexts) have full access for backwards compatibility
  if (!user.clubAdminContexts || user.clubAdminContexts.length === 0) {
    return user.role !== 'super_admin'
  }

  // Find the admin context for the current club
  const targetClub = clubId ?? (user.club ? String(user.club) : null)
  if (!targetClub) return false

  const context = findAdminContext(user, targetClub)
  if (!context) return false

  // Check permission matrix (modern format)
  const matrix = resolveMatrix(context)
  if (matrix) {
    return Boolean(
      matrix.refunds?.view ||
      matrix.refunds?.edit ||
      matrix.reporting?.view ||
      matrix.reporting?.edit
    )
  }

  // Check flat permissions (legacy format)
  const flat = context.permissions || {}
  return Boolean(flat.refunds || flat.analytics || flat.reporting)
}

/**
 * Checks if a user can access system owner-only reports.
 * 
 * System Owner Reports:
 * - Ads Generated vs Money Earned
 * - Ad Performance
 * - Feature Selector Audit
 */
export function isSystemOwner(user: AdminLike | null | undefined): boolean {
  return user?.role === 'system_owner'
}

/**
 * Checks if a user can access super admin++ reports.
 * 
 * Super Admin++ Reports:
 * - Super Admin Audit Log
 * - Subscription Billing
 * - WhatsApp Billing
 */
export function isSuperAdminOrAbove(
  user: AdminLike | null | undefined,
  clubId?: string | null
): boolean {
  const effectiveRole = getEffectiveAdminRole(user, clubId)
  return effectiveRole === 'super_admin' || effectiveRole === 'system_owner'
}
