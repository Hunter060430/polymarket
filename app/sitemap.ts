import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'

export const revalidate = 3600

// Cap the number of market URLs so the sitemap stays well within the 50k-URL /
// 50MB limits and generates quickly. The highest-volume markets are the most
// valuable to index.
const MAX_MARKET_URLS = 2000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`,                  lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${SITE_URL}/dashboard`,        lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/markets`,          lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/markets/resolved`, lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE_URL}/compare`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${SITE_URL}/methodology`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/api-docs`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/pricing`,          lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/about`,            lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/disclaimer`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/terms`,            lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/whitepaper`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  try {
    const markets = await fetchAllActivePolymarketMarkets()

    // Highest-volume markets first.
    const marketRoutes: MetadataRoute.Sitemap = [...markets]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, MAX_MARKET_URLS)
      .map((m) => ({
        url: `${SITE_URL}/markets/${m.marketId}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }))

    // Unique category pages.
    const categories = new Set<string>()
    for (const m of markets) {
      if (m.eventCategory) {
        categories.add(m.eventCategory.toLowerCase().replace(/\s+/g, '-'))
      }
    }
    const categoryRoutes: MetadataRoute.Sitemap = [...categories].map((slug) => ({
      url: `${SITE_URL}/markets/category/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }))

    return [...staticRoutes, ...categoryRoutes, ...marketRoutes]
  } catch {
    // If the data feed is down, still return the static routes.
    return staticRoutes
  }
}
