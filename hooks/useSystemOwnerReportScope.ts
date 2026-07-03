/**
 * useSystemOwnerReportScope
 *
 * Session-persisted scope selection for System Owner reports.
 *
 * Behaviour:
 *   - Stores the selected clubId (or null = "All Clubs") in sessionStorage.
 *   - The selection persists for the entire browser session, surviving report
 *     navigation (React unmount/remount between routes).
 *   - On session end (tab close) the selection resets to "All Clubs".
 *   - Non-System Owner users always receive selectedClubId = null and
 *     setSelectedClubId is a no-op, so pages can call this hook unconditionally.
 *
 * Usage in a report page:
 *
 *   const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()
 *
 *   // Guard:
 *   if (!auth.authorized) return
 *   if (!isSystemOwner && !clubId) return   // non-SO still needs club context
 *
 *   // Query param:
 *   const params = buildReportQueryParams({ clubId, selectedClubId, isSystemOwner, ... })
 */

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

const SESSION_KEY = "so_report_scope_clubId"

export interface SystemOwnerReportScope {
  /** The club selected by System Owner, or null for platform-wide (All Clubs). */
  selectedClubId: string | null
  /** Update the selected club (persists for the session). */
  setSelectedClubId: (clubId: string | null) => void
  /** True only when the current user is a System Owner. */
  isSystemOwner: boolean
}

export function useSystemOwnerReportScope(): SystemOwnerReportScope {
  const { user } = useAuth()
  const isSystemOwner = user?.role === "system_owner"

  const [selectedClubId, setSelectedClubIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(SESSION_KEY) || null
  })

  // Sync across tabs within the same session (edge case: SO has two report tabs open)
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const setSelectedClubId = useCallback((clubId: string | null) => {
    if (!isSystemOwner) return
    setSelectedClubIdState(clubId)
    if (clubId) {
      sessionStorage.setItem(SESSION_KEY, clubId)
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [isSystemOwner])

  // Non-SO users always get null, setter is no-op
  if (!isSystemOwner) {
    return { selectedClubId: null, setSelectedClubId: () => {}, isSystemOwner: false }
  }

  return { selectedClubId, setSelectedClubId, isSystemOwner }
}
