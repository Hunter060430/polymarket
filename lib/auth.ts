import { betterAuth } from 'better-auth'
import { siwe } from 'better-auth/plugins/siwe'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { pool } from '@/lib/db'

// Priority: v0 preview runtime > production URL > fallback
// BETTER_AUTH_URL is the production domain — in preview/dev the cookie
// domain must match the actual request origin, so we prefer V0_RUNTIME_URL.
const baseURL =
  process.env.V0_RUNTIME_URL ??
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

function getDomain(): string {
  try {
    return baseURL ? new URL(baseURL).host : 'localhost:3000'
  } catch {
    return 'localhost:3000'
  }
}

// Public client used only to verify wallet signatures (EOA + smart wallets)
const publicClient = createPublicClient({ chain: mainnet, transport: http() })

export const auth = betterAuth({
  database: pool,
  baseURL,
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    siwe({
      domain: getDomain(),
      // Wallet-only users have no email; generate a placeholder one.
      emailDomainName: getDomain().replace(/:.*$/, ''),
      anonymous: true,
      getNonce: async () =>
        crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''),
      verifyMessage: async ({ message, signature, address }) => {
        try {
          return await publicClient.verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
          })
        } catch {
          return false
        }
      },
    }),
  ],
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // v0 preview iframes and Vercel preview deployments use dynamic subdomains
    'https://*.vusercontent.net',
    'https://*.vercel.app',
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
