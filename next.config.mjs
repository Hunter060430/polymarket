import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
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
