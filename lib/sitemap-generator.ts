export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

const BASE_URL = 'https://wingmanpro.tech'

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
      url: `${BASE_URL}/refund`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ppsa`,
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

export async function getEventPages(): Promise<SitemapEntry[]> {
  try {
    
    return []
  } catch (error) {
    return []
  }
}

export async function getClubPages(): Promise<SitemapEntry[]> {
  try {
    return []
  } catch (error) {
    return []
  }
}

export async function getMerchandisePages(): Promise<SitemapEntry[]> {
  try {
    return []
  } catch (error) {
    return []
  }
}

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
