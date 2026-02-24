"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { DEFAULT_WEBSITE_SECTIONS, sanitizeWebsiteSections } from "@/lib/websiteSections"
import type { WebsiteSectionKey } from "@/lib/websiteSections"

interface ClubSettings {
  websiteSetup?: {
    sections?: Record<string, any>
    [key: string]: any
  }
  /** Member dashboard section visibility (user view). Used for sidebar/nav visibility. */
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubId) {
      setSettings(null)
      setLoading(false)
      return
    }

    // Clear previous club's settings immediately so we never show wrong club's data after switch
    setSettings(null)
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
  }, [clubId])

  /** Uses memberSectionVisibility (dashboard) for visibility; falls back to websiteSetup.sections for backward compatibility. */
  const isSectionVisible = (section: WebsiteSectionKey) => {
    const value =
      settings?.memberSectionVisibility?.sections?.[section] ??
      settings?.websiteSetup?.sections?.[section]
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
    settings,
    loading,
    isSectionVisible,
  }
}
