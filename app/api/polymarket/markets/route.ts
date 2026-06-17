import { NextResponse } from 'next/server'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse, NormalizedMarket } from '@/lib/types'
import { calculateRuleClarityScore } from '@/lib/rule-clarity-score'

const MOCK_MARKETS: NormalizedMarket[] = [
  {
    eventId: 'mock-1',
    eventTitle: 'US Presidential Election 2024',
    eventSlug: 'us-presidential-election-2024',
    eventCategory: 'Politics',
    marketId: 'mock-market-1',
    marketSlug: 'will-candidate-win',
    question: 'Will the Democratic candidate win the 2024 US Presidential Election?',
    description:
      'This market resolves YES if the Democratic Party candidate wins the 2024 US Presidential election as officially certified by Congress. Resolution source: official Congressional certification. Timezone: ET. This market does not consider recounts or pending legal challenges as delay factors.',
    resolutionSource: 'Official Congressional certification',
    endDate: '2025-01-20T12:00:00Z',
    volume: 5200000,
    liquidity: 980000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.48, 0.52],
    conditionId: 'mock-condition-1',
    clobTokenIds: ['tok-1a', 'tok-1b'],
    active: true,
    closed: false,
    score: calculateRuleClarityScore({
      question: 'Will the Democratic candidate win the 2024 US Presidential Election?',
      description:
        'This market resolves YES if the Democratic Party candidate wins the 2024 US Presidential election as officially certified by Congress. Resolution source: official Congressional certification. Timezone: ET.',
      resolutionSource: 'Official Congressional certification',
      outcomes: ['Yes', 'No'],
      endDate: '2025-01-20T12:00:00Z',
    }),
  },
  {
    eventId: 'mock-2',
    eventTitle: 'Federal Reserve Rate Decision',
    eventSlug: 'fed-rate-decision-q1-2025',
    eventCategory: 'Economics',
    marketId: 'mock-market-2',
    marketSlug: 'fed-rate-cut-march',
    question: 'Will the Federal Reserve cut rates at the March 2025 FOMC meeting?',
    description:
      'Resolves YES if the Federal Reserve announces a rate cut at the March 2025 FOMC meeting per the official press release published on federalreserve.gov. Delays, emergency sessions, or unscheduled announcements are excluded. Timezone: ET.',
    resolutionSource: 'federalreserve.gov official press release',
    endDate: '2025-03-20T18:00:00Z',
    volume: 1800000,
    liquidity: 340000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.35, 0.65],
    conditionId: 'mock-condition-2',
    clobTokenIds: ['tok-2a', 'tok-2b'],
    active: true,
    closed: false,
    score: calculateRuleClarityScore({
      question: 'Will the Federal Reserve cut rates at the March 2025 FOMC meeting?',
      description:
        'Resolves YES if the Federal Reserve announces a rate cut at the March 2025 FOMC meeting per the official press release published on federalreserve.gov. Delays, emergency sessions, or unscheduled announcements are excluded. Timezone: ET.',
      resolutionSource: 'federalreserve.gov official press release',
      outcomes: ['Yes', 'No'],
      endDate: '2025-03-20T18:00:00Z',
    }),
  },
  {
    eventId: 'mock-3',
    eventTitle: 'Crypto Price Movement',
    eventSlug: 'btc-price-q1-2025',
    eventCategory: 'Crypto',
    marketId: 'mock-market-3',
    marketSlug: 'btc-above-100k',
    question: 'Will BTC price significantly exceed 100K?',
    description: 'Resolves based on credible reporting.',
    resolutionSource: '',
    endDate: '',
    volume: 250000,
    liquidity: 45000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.42, 0.58],
    conditionId: 'mock-condition-3',
    clobTokenIds: ['tok-3a', 'tok-3b'],
    active: true,
    closed: false,
    score: calculateRuleClarityScore({
      question: 'Will BTC price significantly exceed 100K?',
      description: 'Resolves based on credible reporting.',
      resolutionSource: '',
      outcomes: ['Yes', 'No'],
      endDate: '',
    }),
  },
]

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
    console.error('[api/polymarket/markets] Live fetch failed, using mock fallback:', error)

    const uniqueEventIds = new Set(MOCK_MARKETS.map((m) => m.eventId))

    const response: MarketsApiResponse = {
      scannedAt: new Date().toISOString(),
      eventCount: uniqueEventIds.size,
      marketCount: MOCK_MARKETS.length,
      markets: MOCK_MARKETS,
    }

    return NextResponse.json(response, {
      headers: { 'X-Data-Source': 'mock-fallback' },
    })
  }
}
