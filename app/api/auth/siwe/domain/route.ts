// Returns the domain string that the SIWE plugin is configured to expect.
// Clients must use this exact value in the SIWE message's "domain" field
// to avoid mismatch errors during verify.

export const dynamic = 'force-dynamic'

// Must mirror the siweDomainURL logic in lib/auth.ts exactly.
// SIWE domain is always the canonical production domain (ver.watch),
// never the preview runtime URL.
function getExpectedDomain(): string {
  const base =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  try {
    return new URL(base).host
  } catch {
    return 'localhost:3000'
  }
}

export async function GET() {
  const domain = getExpectedDomain()
  console.log('[v0] /api/auth/siwe/domain returning:', domain, '| BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL)
  return Response.json({ domain })
}
