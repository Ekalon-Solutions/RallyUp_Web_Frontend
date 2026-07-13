/**
 * buildReportQueryParams
 *
 * Shared helper that constructs the query-param object for every report API
 * request. Centralises the SO scope logic so no report page duplicates it.
 *
 * Rules:
 *   - System Owner with a selectedClubId  → sends ?clubId=<id>    (club-scoped)
 *   - System Owner with no selectedClubId → omits clubId          (all-clubs)
 *   - All other roles                     → sends ?clubId=<clubId> (required)
 *
 * Additional filters (dates, search, status, extras) are spread in only when
 * they have a value. This matches the Pattern v1.2 convention used by every
 * report page in the project.
 */

import type { ReportFiltersState } from "@/components/reports/types"

export interface BuildReportQueryParamsOptions {
  /** Club ID from useRequiredClubId() — null for System Owner */
  clubId: string | null
  /** Scope-selected club from useSystemOwnerReportScope() — null = all clubs */
  selectedClubId: string | null
  /** True only when the current user is System Owner */
  isSystemOwner: boolean
  /** Current page number */
  page: number
  /** Rows per page */
  limit?: number
  /** Current sort state */
  sort?: { field: string; direction: "asc" | "desc" }
  /** Current filter state */
  filters?: ReportFiltersState
  /** Any additional report-specific params */
  extra?: Record<string, any>
}

export function buildReportQueryParams({
  clubId,
  selectedClubId,
  isSystemOwner,
  page,
  limit = 20,
  sort,
  filters,
  extra,
}: BuildReportQueryParamsOptions): Record<string, any> {
  const params: Record<string, any> = { page, limit }

  // ── Club ID resolution ──────────────────────────────────────────────────────
  if (isSystemOwner) {
    // SO: only send clubId when a specific club is selected
    if (selectedClubId) params.clubId = selectedClubId
    // else omit → backend resolves to all-clubs scope
  } else if (clubId) {
    // Admin / Super Admin / Financial Admin: always required
    params.clubId = clubId
  }

  // ── Sort ────────────────────────────────────────────────────────────────────
  if (sort) {
    params.sortBy = sort.field
    params.sortDir = sort.direction
  }

  // ── Common filters ──────────────────────────────────────────────────────────
  if (filters) {
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    if (filters.search) params.search = filters.search
    if (filters.status && filters.status !== "all") params.status = filters.status
  }

  // ── Report-specific extra params ────────────────────────────────────────────
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "all") {
        params[key] = value
      }
    })
  }

  return params
}

/**
 * resolveExportClubId
 *
 * Resolves clubId for export requests respecting System Owner scope.
 * System Owner with selectedClubId → club-scoped export
 * System Owner with no selectedClubId → all-clubs export (omit clubId)
 * All other roles → uses their resolved clubId
 */
export function resolveExportClubId(options: {
  clubId: string | null
  selectedClubId: string | null
  isSystemOwner: boolean
}): Record<string, string> {
  if (options.isSystemOwner) {
    if (options.selectedClubId) return { clubId: options.selectedClubId }
    return {}
  }
  if (options.clubId) return { clubId: options.clubId }
  return {}
}

/**
 * shouldFetchReport
 *
 * Guard helper — determines whether a fetchReport call should proceed.
 * Replaces the `if (!clubId || !auth.authorized) return` guard in every page.
 *
 * System Owner never needs a clubId to begin fetching (they get all-clubs by
 * default). Every other role needs a resolved clubId before fetching.
 */
export function shouldFetchReport({
  authorized,
  clubId,
  isSystemOwner,
}: {
  authorized: boolean
  clubId: string | null
  isSystemOwner: boolean
}): boolean {
  if (!authorized) return false
  if (!isSystemOwner && !clubId) return false
  return true
}
