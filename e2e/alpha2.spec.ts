import { expect, test } from '@playwright/test'

test('public navigation, filters, news and health are available', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Verdict — Home/i })).toBeVisible()
  await page.goto('/markets')
  await expect(page.getByLabel('Regulatory sensitivity filter')).toBeVisible()
  await expect(page.getByLabel('Liquidity score filter')).toBeVisible()
  await page.goto('/news')
  await expect(page.getByRole('main')).toBeVisible()
  const health = await request.get('/api/health')
  expect([200, 503]).toContain(health.status())
  const payload = await health.json()
  expect(payload.checks).toHaveProperty('database')
  expect(payload.checks).toHaveProperty('polymarket')
})
