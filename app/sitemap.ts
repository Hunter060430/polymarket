import type { MetadataRoute } from 'next'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'

const BASE_URL = 'https://verdict.app'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const markets = await fetchAllActivePolymarketMarkets().catch(() => [])

  // Unique categories
  const categories = [
    ...new Set(markets.map((m) => m.eventCategory).filter(Boolean)),
  ]

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/dashboard`,     lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE_URL}/markets`,       lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE_URL}/markets/resolved`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/methodology`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/api-docs`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/submit-dispute`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const marketRoutes: MetadataRoute.Sitemap = markets.map((m) => ({
    url:             `${BASE_URL}/markets/${m.marketId}`,
    lastModified:    new Date(),
    changeFrequency: 'hourly' as const,
    priority:        0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url:             `${BASE_URL}/markets/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified:    new Date(),
    changeFrequency: 'hourly' as const,
    priority:        0.7,
  }))

  return [...staticRoutes, ...categoryRoutes, ...marketRoutes]
}
