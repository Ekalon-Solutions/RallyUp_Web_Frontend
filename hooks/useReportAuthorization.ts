'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'
import { useClubFeatures } from '@/hooks/useClubFeatures'
import { isFeatureEnabled, type ClubFeatureKey, type ResolvedClubFeatures } from '@/lib/clubFeatures'
import {
  adminHasReportingAccess,
  adminHasFinancialAccess,
  getEffectiveAdminRole,
  isSystemOwner,
  isSuperAdminOrAbove,
} from '@/lib/adminPermissions'
import { REPORT_AUTH_METADATA, type ReportAuthMetadata } from '@/lib/reportMetadata'

export interface ReportAuthorizationResult {
  authorized: boolean
  reason?: 'role' | 'feature' | 'financial' | 'systemOwner' | 'superAdmin'
  message?: string
}

type ReportUser = Parameters<typeof getEffectiveAdminRole>[0]

function getRequiredFeatures(metadata: ReportAuthMetadata): ClubFeatureKey[] {
  if (!metadata.requiredFeature) return []

  const features = Array.isArray(metadata.requiredFeature)
    ? metadata.requiredFeature
    : [metadata.requiredFeature]

  return features as ClubFeatureKey[]
}

export function authorizeReportAccess(
  reportId: string,
  user: ReportUser,
  clubId: string | null,
  clubFeatureConfig?: ResolvedClubFeatures | null
): ReportAuthorizationResult {
  const metadata = REPORT_AUTH_METADATA[reportId]
  if (!metadata) {
    console.warn(`[useReportAuthorization] No metadata found for report: ${reportId}`)
    return {
      authorized: false,
      reason: 'role',
      message: 'Report configuration error',
    }
  }

  if (isSystemOwner(user) && !clubId) {
    return { authorized: true }
  }

  const features = getRequiredFeatures(metadata)
  const usesClubScopedAuthorization = Boolean(
    clubId && (features.length > 0 || metadata.financialAdminOnly)
  )
  const authorizationClubId = usesClubScopedAuthorization ? clubId : null
  const effectiveRole = getEffectiveAdminRole(user, authorizationClubId)

  if (metadata.systemOwnerOnly && !isSystemOwner(user)) {
    return {
      authorized: false,
      reason: 'systemOwner',
      message: 'This report is restricted to system owners',
    }
  }

  if (metadata.superAdminPlusOnly && !isSuperAdminOrAbove(user, authorizationClubId)) {
    return {
      authorized: false,
      reason: 'superAdmin',
      message: 'This report is restricted to super administrators',
    }
  }

  if (metadata.requiredRole && !metadata.requiredRole.includes(effectiveRole as any)) {
    return {
      authorized: false,
      reason: 'role',
      message: 'You do not have the required role to access this report',
    }
  }

  if (features.length > 0) {
    const hasFeature = features.some((feature) =>
      isFeatureEnabled(clubFeatureConfig, feature)
    )

    if (!hasFeature) {
      return {
        authorized: false,
        reason: 'feature',
        message: `This report requires the ${features.join(' or ')} feature`,
      }
    }
  }

  if (metadata.financialAdminOnly && effectiveRole === 'admin') {
    const hasFinancialAccess = adminHasFinancialAccess(user, clubId)
    if (!hasFinancialAccess) {
      return {
        authorized: false,
        reason: 'financial',
        message:
          'This report is restricted to financial administrators. Contact your club owner for access.',
      }
    }
  }

  if (
    !metadata.financialAdminOnly &&
    effectiveRole === 'admin' &&
    features.includes('reporting') &&
    !adminHasReportingAccess(user, clubId)
  ) {
    return {
      authorized: false,
      reason: 'role',
      message: 'You do not have permission to view reports.',
    }
  }

  return { authorized: true }
}

/**
 * Authorization Hook for Report Pages
 * 
 * Implements centralized RBAC logic for all report pages.
 * Performs 5-step authorization check:
 * 1. Basic role requirements (admin/super_admin/system_owner)
 * 2. Feature gate requirements using club features
 * 3. Financial admin status (for financial reports)
 * 4. System owner restriction (for platform-level reports)
 * 5. Super admin++ restriction (for cross-tenant reports)
 * 
 * @param reportId - The unique identifier for the report (must exist in REPORT_AUTH_METADATA)
 * @returns Authorization result with status and optional error details
 * 
 * @example
 * ```tsx
 * const auth = useReportAuthorization('total-order-summary')
 * if (!auth.authorized) {
 *   return <AccessDeniedPage reason={auth.reason} message={auth.message} />
 * }
 * ```
 */
export function useReportAuthorization(
  reportId: string
): ReportAuthorizationResult {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)

  return authorizeReportAccess(reportId, user, clubId, clubFeatureConfig)
}
