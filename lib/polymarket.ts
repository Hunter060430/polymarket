import type { PolymarketEvent, PolymarketMarket, NormalizedMarket } from './types'
import { calculateRuleClarityScore } from './rule-clarity-score'

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com'
const PAGE_LIMIT = 100
const DELAY_MS = 150
const REQUEST_TIMEOUT_MS = 10000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchPolymarketEventsPage(
  offset: number,
  limit: number = PAGE_LIMIT
): Promise<PolymarketEvent[]> {
  const url = new URL(`${GAMMA_API_BASE}/events`)
  url.searchParams.set('active', 'true')
  url.searchParams.set('closed', 'false')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))

  console.log(`[polymarket] Fetching events page — offset: ${offset}, limit: ${limit}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Gamma API responded with status ${res.status} for offset ${offset}`)
    }

    const data = await res.json()
    const events: PolymarketEvent[] = Array.isArray(data) ? data : []
    console.log(`[polymarket] offset ${offset} → ${events.length} events returned`)
    return events
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Request timed out fetching events at offset ${offset}`)
    }
    throw err
  }
}

export async function fetchAllActivePolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = []
  let offset = 0

  while (true) {
    const page = await fetchPolymarketEventsPage(offset)

    if (page.length === 0) {
      console.log(`[polymarket] Empty page at offset ${offset}. Stopping pagination.`)
      break
    }

    allEvents.push(...page)
    console.log(`[polymarket] Total events so far: ${allEvents.length}`)

    if (page.length < PAGE_LIMIT) {
      console.log(`[polymarket] Last page reached (${page.length} < ${PAGE_LIMIT}). Stopping.`)
      break
    }

    offset += PAGE_LIMIT
    await sleep(DELAY_MS)
  }

  console.log(`[polymarket] Fetched ${allEvents.length} total active events.`)
  return allEvents
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

export async function fetchAllActivePolymarketMarkets(): Promise<NormalizedMarket[]> {
  const events = await fetchAllActivePolymarketEvents()
  const markets = normalizePolymarketMarkets(events)
  console.log(`[polymarket] Normalized ${markets.length} markets from ${events.length} events.`)
  return markets
}
