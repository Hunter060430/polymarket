import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fetchPolymarketEventsPage } from '@/lib/polymarket'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  const checks = { database: false, polymarket: false }
  const errors: string[] = []

  try {
    await db.execute(sql`select 1`)
    checks.database = true
  } catch {
    errors.push('database unavailable')
  }

  try {
    const events = await fetchPolymarketEventsPage(0)
    checks.polymarket = events.length > 0
    if (!checks.polymarket) errors.push('Polymarket returned no active events')
  } catch {
    errors.push('Polymarket API unavailable')
  }

  const healthy = checks.database && checks.polymarket
  return NextResponse.json({ status: healthy ? 'ok' : 'degraded', checks, latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString(), errors }, { status: healthy ? 200 : 503 })
}
