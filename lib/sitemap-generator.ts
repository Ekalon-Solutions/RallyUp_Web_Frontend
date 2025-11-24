/**
 * Sitemap Generator Utilities
 * Use these functions to dynamically generate sitemap entries
 */

export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

const BASE_URL = 'https://wingmanpro.tech'

/**
 * Generate sitemap entries for static pages
 */
export function getStaticPages(): SitemapEntry[] {
  const currentDate = new Date()

  return [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/clubs`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/merchandise`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faqs`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/affiliations`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}

/**
 * Generate sitemap entries for events
 * Call your API to fetch events and generate entries
 */
export async function getEventPages(): Promise<SitemapEntry[]> {
  try {
    // TODO: Replace with your actual API call
    // const response = await fetch(`${BASE_URL}/api/events`)
    // const events = await response.json()
    
    // Example structure:
    // return events.map(event => ({
    //   url: `${BASE_URL}/events/${event.id}`,
    //   lastModified: new Date(event.updatedAt),
    //   changeFrequency: 'weekly',
    //   priority: 0.7,
    // }))
    
    return []
  } catch (error) {
    console.error('Error fetching event pages for sitemap:', error)
    return []
  }
}

/**
 * Generate sitemap entries for clubs
 */
export async function getClubPages(): Promise<SitemapEntry[]> {
  try {
    // TODO: Replace with your actual API call
    // const response = await fetch(`${BASE_URL}/api/clubs`)
    // const clubs = await response.json()
    
    // return clubs.map(club => ({
    //   url: `${BASE_URL}/clubs/${club.id}`,
    //   lastModified: new Date(club.updatedAt),
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    // }))
    
    return []
  } catch (error) {
    console.error('Error fetching club pages for sitemap:', error)
    return []
  }
}

/**
 * Generate sitemap entries for merchandise
 */
export async function getMerchandisePages(): Promise<SitemapEntry[]> {
  try {
    // TODO: Replace with your actual API call
    // const response = await fetch(`${BASE_URL}/api/merchandise`)
    // const items = await response.json()
    
    // return items.map(item => ({
    //   url: `${BASE_URL}/merchandise/${item.id}`,
    //   lastModified: new Date(item.updatedAt),
    //   changeFrequency: 'weekly',
    //   priority: 0.6,
    // }))
    
    return []
  } catch (error) {
    console.error('Error fetching merchandise pages for sitemap:', error)
    return []
  }
}

/**
 * Generate complete sitemap
 */
export async function generateSitemap(): Promise<SitemapEntry[]> {
  const [staticPages, eventPages, clubPages, merchandisePages] = await Promise.all([
    Promise.resolve(getStaticPages()),
    getEventPages(),
    getClubPages(),
    getMerchandisePages(),
  ])

  return [
    ...staticPages,
    ...eventPages,
    ...clubPages,
    ...merchandisePages,
  ]
}
