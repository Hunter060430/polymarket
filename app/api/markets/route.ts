import { NextRequest, NextResponse } from 'next/server'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Optional query params:
//   ?risk=Critical|High|Medium|Low   — filter by risk level
//   ?minScore=0                       — minimum clarity score (0-100)
//   ?limit=100                        — max results (default 100, max 500)
//   ?offset=0                         — pagination offset

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const queryParam    = searchParams.get('q')
  const riskParam     = searchParams.get('risk')
  const minScoreParam = searchParams.get('minScore')
  const regulatoryParam = searchParams.get('regulatory')
  const liquidityParam = searchParams.get('liquidity')
  const limitParam    = searchParams.get('limit')
  const offsetParam   = searchParams.get('offset')

  const requestedLimit = Number(limitParam ?? 100)
  const requestedOffset = Number(offsetParam ?? 0)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 500) : 100
  const offset = Number.isFinite(requestedOffset) ? Math.max(Math.trunc(requestedOffset), 0) : 0

  try {
    const allMarkets = await fetchAllActivePolymarketMarkets()

    let markets = allMarkets

    // Full-text search across the ENTIRE dataset (not just the first page),
    // so the command palette can find any market by question or category.
    if (queryParam && queryParam.trim().length > 0) {
      const q = queryParam.trim().toLowerCase()
      markets = markets.filter(
        (m) =>
          m.question.toLowerCase().includes(q) ||
          (m.eventCategory ?? '').toLowerCase().includes(q)
      )
    }

    if (riskParam && ['Critical', 'High', 'Medium', 'Low'].includes(riskParam)) {
      markets = markets.filter((m) => m.score.riskLevel === riskParam)
    }

    if (minScoreParam !== null) {
      const minScore = Number(minScoreParam)
      if (!isNaN(minScore)) {
        markets = markets.filter((m) => m.score.totalScore >= minScore)
      }
    }

    const levels = ['Critical', 'High', 'Medium', 'Low']
    if (regulatoryParam && levels.includes(regulatoryParam)) {
      markets = markets.filter((market) => market.regulatorySensitivity.level === regulatoryParam)
    }
    if (liquidityParam && levels.includes(liquidityParam)) {
      markets = markets.filter((market) => market.liquidityScore.level === liquidityParam)
    }

    const paginated = markets.slice(offset, offset + limit)

    const body: MarketsApiResponse = {
      scannedAt:   new Date().toISOString(),
      eventCount:  new Set(paginated.map((m) => m.eventId)).size,
      marketCount: paginated.length,
      markets:     paginated,
    }

    return NextResponse.json(body, {
      status: 200,
      headers: {
        'Cache-Control':                'public, s-maxage=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })
  } catch (err) {
    console.error('[verdict] /api/markets error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch markets. Please try again shortly.' },
      { status: 500 }
    )
  }
}
