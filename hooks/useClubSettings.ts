"use client"

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface ClubSettings {
  websiteSetup: {
    sections: {
      news: boolean
      events: boolean
      store: boolean
      polls: boolean
      chants: boolean
      members: boolean
      merchandise: boolean
    }
  }
}

export function useClubSettings(clubId?: string) {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubId) {
      setLoading(false)
      return
    }

    const fetchSettings = async () => {
      try {
        const response = await apiClient.getClubSettings(clubId)
        if (response.success && response.data) {
          // Backend returns { success: true, data: settings }
          // API client wraps it as { success: true, data: { success: true, data: settings } }
          // So we need response.data.data
          const actualData = response.data.data || response.data
          // console.log('useClubSettings - Actual data:', actualData)
          setSettings(actualData)
        }
      } catch (error) {
        // console.error('Error loading club settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [clubId])

  const isSectionVisible = (section: keyof ClubSettings['websiteSetup']['sections']) => {
    const visible = settings?.websiteSetup?.sections?.[section] ?? true
    return visible
  }

  return {
    settings,
    loading,
    isSectionVisible,
  }
}
