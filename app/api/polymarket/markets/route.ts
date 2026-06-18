import { NextResponse } from 'next/server'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse } from '@/lib/types'

// Force dynamic execution — the JSON payload (~24 MB) exceeds Vercel's ISR
// pre-render limit of 19 MB, so we cannot use revalidate here. Caching is
// handled upstream by fetchAllActivePolymarketMarkets (5-min in-memory cache)
// and by the Cache-Control header below.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const markets = await fetchAllActivePolymarketMarkets()
    const uniqueEventIds = new Set(markets.map((m) => m.eventId))

    const response: MarketsApiResponse = {
      scannedAt: new Date().toISOString(),
      eventCount: uniqueEventIds.size,
      marketCount: markets.length,
      markets,
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('[api/polymarket/markets] Fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data. Please try again shortly.' },
      { status: 503 }
    )
  }
}
