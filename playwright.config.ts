import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: 1,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000', colorScheme: 'dark', viewport: { width: 1293, height: 989 }, trace: 'retain-on-failure' },
  webServer: { command: 'pnpm dev', url: 'http://127.0.0.1:3000', reuseExistingServer: true, timeout: 120_000 },
})
