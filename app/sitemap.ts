import { MetadataRoute } from 'next'
import { generateSitemap } from '@/lib/sitemap-generator'


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await generateSitemap()
    return entries
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    const baseUrl = 'https://wingmanpro.tech'
    const currentDate = new Date()
    
    return [
      {
        url: baseUrl,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/events`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/clubs`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/merchandise`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]
  }
}
