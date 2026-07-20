import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep preview artifacts separate from stale Turbopack chunks left by prior
  // dev-server generations. This prevents old HMR manifests from being served.
  distDir: '.next-webpack',
  images: {
    unoptimized: true,
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'verdict-52',
  project: process.env.SENTRY_PROJECT ?? 'verdict',
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
