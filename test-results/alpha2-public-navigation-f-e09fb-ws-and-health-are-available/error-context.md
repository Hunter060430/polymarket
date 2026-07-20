# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alpha2.spec.ts >> public navigation, filters, news and health are available
- Location: e2e/alpha2.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3000/markets", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | test('public navigation, filters, news and health are available', async ({ page, request }) => {
  4  |   await page.goto('/')
  5  |   await expect(page.getByRole('link', { name: /Verdict — Home/i })).toBeVisible()
> 6  |   await page.goto('/markets')
     |              ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  7  |   await expect(page.getByLabel('Regulatory sensitivity filter')).toBeVisible()
  8  |   await expect(page.getByLabel('Liquidity score filter')).toBeVisible()
  9  |   await page.goto('/news')
  10 |   await expect(page.getByRole('main')).toBeVisible()
  11 |   const health = await request.get('/api/health')
  12 |   expect([200, 503]).toContain(health.status())
  13 |   const payload = await health.json()
  14 |   expect(payload.checks).toHaveProperty('database')
  15 |   expect(payload.checks).toHaveProperty('polymarket')
  16 | })
  17 | 
```