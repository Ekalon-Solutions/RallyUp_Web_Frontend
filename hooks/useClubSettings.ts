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

    const fetchSettings = async () => {
      try {
        const cacheKey = `clubSettings:${clubId}`
        if (typeof window !== "undefined") {
          const cached = window.sessionStorage.getItem(cacheKey)
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed && typeof parsed === "object") {
                setSettings(parsed)
                setLoading(false)
              }
            } catch {
            }
          } else {
            setLoading(true)
          }
        } else {
          setLoading(true)
        }

        const response = await apiClient.getClubSettings(clubId)
        if (response.success && response.data) {
          const actualData = response.data.data || response.data
          const sanitizedSections = {
            ...DEFAULT_WEBSITE_SECTIONS,
            ...sanitizeWebsiteSections(actualData?.websiteSetup?.sections),
          }

          const normalized: ClubSettings = {
            ...(actualData || {}),
            websiteSetup: {
              ...(actualData?.websiteSetup || {}),
              sections: sanitizedSections,
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
        // console.error('Error loading club settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [clubId])

  const isSectionVisible = (section: WebsiteSectionKey) => {
    const value = settings?.websiteSetup?.sections?.[section]
    // Normalize weird values (e.g. "false" string) without breaking "default visible" behavior.
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
