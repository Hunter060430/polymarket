// Returns the domain string that the SIWE plugin is configured to expect.
// Clients must use this exact value in the SIWE message's "domain" field
// to avoid mismatch errors during verify.

export const dynamic = 'force-dynamic'

function getExpectedDomain(): string {
  const base =
    process.env.V0_RUNTIME_URL ??
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
  try {
    return new URL(base).host
  } catch {
    return 'localhost:3000'
  }
}

export async function GET() {
  return Response.json({ domain: getExpectedDomain() })
}
