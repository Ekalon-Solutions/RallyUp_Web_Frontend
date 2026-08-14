"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { DEFAULT_WEBSITE_SECTIONS, sanitizeWebsiteSections } from "@/lib/websiteSections"
import type { WebsiteSectionKey } from "@/lib/websiteSections"

const CLUB_SETTINGS_INVALIDATED_EVENT = "club-settings:invalidated"

export function invalidateClubSettings(clubId: string) {
  if (typeof window === "undefined") return

  try {
    window.sessionStorage.removeItem(`clubSettings:${clubId}`)
  } catch {
  }

  window.dispatchEvent(new CustomEvent(CLUB_SETTINGS_INVALIDATED_EVENT, {
    detail: { clubId },
  }))
}

interface ClubSettings {
  websiteSetup?: {
    sections?: Record<string, any>
    [key: string]: any
  }
  memberSectionVisibility?: {
    sections?: Record<string, any>
    [key: string]: any
  }
  designSettings?: {
    logo?: string | null
    [key: string]: any
  }
  [key: string]: any
}

export function useClubSettings(clubId?: string) {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [loadedForClubId, setLoadedForClubId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [cacheVersion, setCacheVersion] = useState(0)

  useEffect(() => {
    const handleInvalidation = (event: Event) => {
      const invalidatedClubId = (event as CustomEvent<{ clubId?: string }>).detail?.clubId
      if (invalidatedClubId && String(invalidatedClubId) === String(clubId)) {
        setCacheVersion((version) => version + 1)
      }
    }

    window.addEventListener(CLUB_SETTINGS_INVALIDATED_EVENT, handleInvalidation)
    return () => window.removeEventListener(CLUB_SETTINGS_INVALIDATED_EVENT, handleInvalidation)
  }, [clubId])

  useEffect(() => {
    if (!clubId) {
      setSettings(null)
      setLoadedForClubId(undefined)
      setLoading(false)
      return
    }

    setLoading(true)

    let cancelled = false

    const fetchSettings = async () => {
      const currentClubId = clubId
      try {
        const cacheKey = `clubSettings:${currentClubId}`
        if (typeof window !== "undefined") {
          const cached = window.sessionStorage.getItem(cacheKey)
          if (cached && !cancelled) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed && typeof parsed === "object") {
                setSettings(parsed)
                setLoadedForClubId(currentClubId)
                setLoading(false)
              }
            } catch {
            }
          }
        }

        const response = await apiClient.getClubSettings(currentClubId)
        if (cancelled) return
        if (response.success && response.data) {
          const actualData = response.data.data || response.data
          const sanitizedWebsiteSections = {
            ...DEFAULT_WEBSITE_SECTIONS,
            ...sanitizeWebsiteSections(actualData?.websiteSetup?.sections),
          }
          const sanitizedMemberSections = {
            ...DEFAULT_WEBSITE_SECTIONS,
            ...sanitizeWebsiteSections(actualData?.memberSectionVisibility?.sections),
          }

          const normalized: ClubSettings = {
            ...(actualData || {}),
            websiteSetup: {
              ...(actualData?.websiteSetup || {}),
              sections: sanitizedWebsiteSections,
            },
            memberSectionVisibility: {
              ...(actualData?.memberSectionVisibility || {}),
              sections: sanitizedMemberSections,
            },
          }

          setSettings(normalized)
          setLoadedForClubId(currentClubId)

          if (typeof window !== "undefined") {
            try {
              window.sessionStorage.setItem(cacheKey, JSON.stringify(normalized))
            } catch {
            }
          }
        }
      } catch (error) {
        if (!cancelled) setLoading(false)
        return
      }
      if (!cancelled) setLoading(false)
    }

    fetchSettings()
    return () => {
      cancelled = true
    }
  }, [clubId, cacheVersion])

  // Never expose club A's settings after the sidebar switches to club B —
  // the state update in the effect above is one render too late.
  const scopedSettings = loadedForClubId && clubId && loadedForClubId === clubId ? settings : null
  const scopedLoading = Boolean(clubId) && (loadedForClubId !== clubId || loading)

  const isSectionVisible = (section: WebsiteSectionKey) => {
    const value =
      scopedSettings?.memberSectionVisibility?.sections?.[section] ??
      scopedSettings?.websiteSetup?.sections?.[section]
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
      const v = value.trim().toLowerCase()
      if (v === "false" || v === "0" || v === "off") return false
      if (v === "true" || v === "1" || v === "on") return true
    }
    if (typeof value === "number") return value !== 0
    return true
  }

  return {
    settings: scopedSettings,
    loading: scopedLoading,
    isSectionVisible,
  }
}
