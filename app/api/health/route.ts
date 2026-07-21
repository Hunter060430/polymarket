import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  const checks = { database: false, polymarket: false }
  const errors: string[] = []

  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('database health check timed out')), 3_000)),
    ])
    checks.database = true
  } catch {
    errors.push('database unavailable')
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

  const healthy = checks.database && checks.polymarket
  return NextResponse.json({ status: healthy ? 'ok' : 'degraded', checks, latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString(), errors }, { status: healthy ? 200 : 503 })
}
