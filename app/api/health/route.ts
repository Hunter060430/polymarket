import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Uptime monitors hit this endpoint constantly, and a `select 1` would keep
// Neon awake around the clock. The database is only probed with ?deep=1.
export async function GET(request: Request) {
  const startedAt = Date.now()
  const deep = new URL(request.url).searchParams.get('deep') === '1'
  const checks: { database: boolean | 'skipped'; polymarket: boolean } = {
    database: 'skipped',
    polymarket: false,
  }
  const errors: string[] = []

  if (deep) {
    try {
      await Promise.race([
        db.execute(sql`select 1`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('database health check timed out')), 3_000)),
      ])
      checks.database = true
    } catch {
      checks.database = false
      errors.push('database unavailable')
    }
  }

  try {
    const response = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=1', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: 'application/json' },
    })
    checks.polymarket = response.ok
    if (!checks.polymarket) errors.push(`Polymarket API returned ${response.status}`)
  } catch {
    errors.push('Polymarket API unavailable')
  }

  const healthy = checks.database !== false && checks.polymarket
  return NextResponse.json({ status: healthy ? 'ok' : 'degraded', checks, latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString(), errors }, { status: healthy ? 200 : 503 })
}
