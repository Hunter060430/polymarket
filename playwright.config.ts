import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000', colorScheme: 'dark', viewport: { width: 1293, height: 989 }, trace: 'retain-on-failure' },
  webServer: { command: 'pnpm start', url: 'http://localhost:3000', reuseExistingServer: false, timeout: 120_000 },
})
