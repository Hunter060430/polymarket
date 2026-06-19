// Canonical site URL used for metadata, sitemap, robots, and OG image URLs.
//
// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the stable production domain
// (e.g. "verdict.vercel.app" or a custom domain) and is preferred. We fall
// back to the per-deployment VERCEL_URL, then to localhost for local dev.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (prod) return `https://${prod}`

  const deployment = process.env.VERCEL_URL
  if (deployment) return `https://${deployment}`

  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

export const SITE_NAME = 'Verdict'
