// Canonical site URL used for metadata, sitemap, robots, and OG image URLs.
//
// The production domain is ver.watch. We allow an explicit override via
// NEXT_PUBLIC_SITE_URL, and fall back to localhost only during local dev.
const PRODUCTION_URL = 'https://ver.watch'

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  // In any deployed (non-development) environment, use the canonical domain so
  // metadata, sitemap, robots, and OG URLs always point at ver.watch.
  if (process.env.NODE_ENV === 'production') return PRODUCTION_URL

  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

export const SITE_NAME = 'Verdict'
