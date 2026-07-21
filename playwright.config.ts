import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100', colorScheme: 'dark', viewport: { width: 1293, height: 989 }, trace: 'retain-on-failure' },
  webServer: { command: 'pnpm exec next start -p 3100', url: 'http://localhost:3100', reuseExistingServer: false, timeout: 120_000 },
})
