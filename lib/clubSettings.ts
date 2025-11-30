import { apiClient } from './api'

export interface ClubSettings {
  websiteSetup: {
    title: string
    description: string
    contactEmail: string
    contactPhone: string
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
  designSettings: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    logo: string | null
    motto: string
  }
  appSettings: {
    notifications: any
    maintenanceMode: boolean
    openRegistration: boolean
    publicEvents: boolean
  }
}

let cachedSettings: ClubSettings | null = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getClubSettings(clubId: string, forceRefresh = false): Promise<ClubSettings | null> {
  try {
    // Return cached settings if available and not expired
    if (!forceRefresh && cachedSettings && (Date.now() - cacheTime < CACHE_DURATION)) {
      return cachedSettings
    }

    const response = await apiClient.getClubSettings(clubId)
    if (response.success && response.data) {
      cachedSettings = response.data
      cacheTime = Date.now()
      return response.data
    }
    return null
  } catch (error) {
    // console.error('Error fetching club settings:', error)
    return null
  }
}

export function isSectionVisible(settings: ClubSettings | null, section: string): boolean {
  if (!settings) return true // Default to visible if no settings
  return settings.websiteSetup?.sections?.[section as keyof typeof settings.websiteSetup.sections] !== false
}

export function clearSettingsCache() {
  cachedSettings = null
  cacheTime = 0
}
