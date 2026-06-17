import { unstable_cache } from 'next/cache'
import type { PolymarketEvent, PolymarketMarket, NormalizedMarket } from './types'
import { calculateRuleClarityScore } from './rule-clarity-score'

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com'
// Fetch at most this many events per request — sorted by volume descending so
// we always see the highest-activity, most-scrutinised markets first.
const MAX_EVENTS = 500
const PAGE_LIMIT = 100
const REQUEST_TIMEOUT_MS = 15000
// Cache each individual page for 5 minutes server-side.
const CACHE_REVALIDATE_S = 300

export async function fetchPolymarketEventsPage(
  offset: number,
  limit: number = PAGE_LIMIT
): Promise<PolymarketEvent[]> {
  const url = new URL(`${GAMMA_API_BASE}/events`)
  url.searchParams.set('active', 'true')
  url.searchParams.set('closed', 'false')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  // Sort by volume descending so page 0 contains the markets most relevant for
  // risk analysis (high-liquidity markets attract the most post-trade disputes).
  url.searchParams.set('order', 'volumeNum')
  url.searchParams.set('ascending', 'false')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      // Next.js ISR — reuse cached response for up to 5 min across all requests.
      next: { revalidate: CACHE_REVALIDATE_S },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Gamma API responded with ${res.status} for offset ${offset}`)
    }

    const data = await res.json()
    const events: PolymarketEvent[] = Array.isArray(data) ? data : []
    return events
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Request timed out fetching events at offset ${offset}`)
    }
    throw err
  }
}

export async function fetchActivePolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = []
  let offset = 0

  while (allEvents.length < MAX_EVENTS) {
    const page = await fetchPolymarketEventsPage(offset)

    if (page.length === 0) break

    allEvents.push(...page)

    // Stop when we have enough or the API returned a short page (last page).
    if (page.length < PAGE_LIMIT || allEvents.length >= MAX_EVENTS) break

    offset += PAGE_LIMIT
  }

  // Trim to hard cap in case the last page pushed us slightly over.
  return allEvents.slice(0, MAX_EVENTS)
}

function parseStringArray(raw: string | undefined | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    // not valid JSON, treat as single value
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseNumberArray(raw: string | undefined | null): number[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(Number)
  } catch {
    // not valid JSON
  }
  return raw
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n))
}

function parseNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0
  const n = typeof val === 'number' ? val : parseFloat(val)
  return isNaN(n) ? 0 : n
}

export function normalizePolymarketMarkets(events: PolymarketEvent[]): NormalizedMarket[] {
  const markets: NormalizedMarket[] = []

  for (const event of events) {
    if (!event.markets || !Array.isArray(event.markets)) continue

    for (const market of event.markets) {
      const question = market.question ?? ''
      const description = market.description ?? ''
      const resolutionSource = market.resolutionSource ?? ''
      const endDate = market.endDate ?? ''
      const outcomes = parseStringArray(market.outcomes)
      const outcomePrices = parseNumberArray(market.outcomePrices)
      const clobTokenIds = parseStringArray(market.clobTokenIds)

      const score = calculateRuleClarityScore({
        question,
        description,
        resolutionSource,
        outcomes,
        endDate,
      })

      markets.push({
        eventId: event.id ?? '',
        eventTitle: event.title ?? '',
        eventSlug: event.slug ?? '',
        eventCategory: event.category ?? '',
        marketId: market.id ?? '',
        marketSlug: market.slug ?? '',
        question,
        description,
        resolutionSource,
        endDate,
        volume: parseNumber(market.volume),
        liquidity: parseNumber(market.liquidity),
        outcomes,
        outcomePrices,
        conditionId: market.conditionId ?? '',
        clobTokenIds,
        active: market.active ?? false,
        closed: market.closed ?? false,
        score,
      })
    }
  }

  return markets
}

async function _fetchAllActivePolymarketMarkets(): Promise<NormalizedMarket[]> {
  const events = await fetchActivePolymarketEvents()
  return normalizePolymarketMarkets(events)
}

// Cache the entire normalized result for 5 minutes so concurrent requests
// don't all trigger parallel Gamma API crawls. Only the first request per
// revalidation window pays the fetch cost; all others hit the cache instantly.
export const fetchAllActivePolymarketMarkets = unstable_cache(
  _fetchAllActivePolymarketMarkets,
  ['polymarket-active-markets'],
  { revalidate: 300, tags: ['polymarket-markets'] }
)
