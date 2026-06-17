import { NextResponse } from 'next/server'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse } from '@/lib/types'

// Cache the route response for 5 minutes at the HTTP layer too.
export const revalidate = 300

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

    return NextResponse.json(response)
  } catch (error) {
    console.error('[api/polymarket/markets] Fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data. Please try again shortly.' },
      { status: 503 }
    )
  }
}
