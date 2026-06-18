import { unstable_cache } from 'next/cache'
import type { PolymarketEvent, NormalizedMarket } from './types'
import { calculateRuleClarityScore } from './rule-clarity-score'

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com'
// Fetch at most this many events. 500 gives broad market coverage while
// keeping parallel fetch latency manageable (~5 concurrent pages).
const MAX_EVENTS = 500
const PAGE_LIMIT = 100
const REQUEST_TIMEOUT_MS = 12000

export async function fetchPolymarketEventsPage(offset: number): Promise<PolymarketEvent[]> {
  const url = new URL(`${GAMMA_API_BASE}/events`)
  url.searchParams.set('active', 'true')
  url.searchParams.set('closed', 'false')
  url.searchParams.set('limit', String(PAGE_LIMIT))
  url.searchParams.set('offset', String(offset))
  // Sort by volume descending so page 0 has the highest-activity markets.
  url.searchParams.set('order', 'volume')
  url.searchParams.set('ascending', 'false')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      // Each page is 8-12MB, which exceeds Next.js's 2MB data-cache limit, so
      // we don't attempt to cache at the fetch layer (it would just fail and
      // log noise). Caching is handled by the in-memory layer in
      // fetchAllActivePolymarketMarkets.
      cache: 'no-store',
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Gamma API responded with ${res.status} at offset ${offset}`)
    }

    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Request timed out at offset ${offset}`)
    }
    throw err
  }
}

async function fetchActivePolymarketEvents(): Promise<PolymarketEvent[]> {
  const totalPages = Math.ceil(MAX_EVENTS / PAGE_LIMIT)
  const offsets = Array.from({ length: totalPages }, (_, i) => i * PAGE_LIMIT)

  // Fire all page requests concurrently — total latency equals the slowest
  // single request, not the sum. Failed pages return [] so one bad page
  // doesn't kill the entire result.
  const pages = await Promise.all(
    offsets.map((offset) =>
      fetchPolymarketEventsPage(offset).catch(() => [] as PolymarketEvent[])
    )
  )

  return pages.flat().slice(0, MAX_EVENTS)
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

function parseStringArray(raw: string | undefined | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    /* not JSON */
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
    /* not JSON */
  }
  return raw
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n))
}

function parseNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0
  const n = typeof val === 'number' ? val : parseFloat(val as string)
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

      // Oracle / resolution metadata — Gamma sometimes includes UMA fields.
      const umaStatus = (market.umaResolutionStatus ?? '').toString()
      const resolvedBy = market.resolvedBy
        ? String(market.resolvedBy)
        : umaStatus
        ? 'UMA Optimistic Oracle'
        : ''
      const hasDisputeSignal = /disput|challeng|propos|reject/i.test(umaStatus)

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
        oneDayPriceChange: parseNumber(market.oneDayPriceChange),
        volume24hr: parseNumber(market.volume24hr),
        oracle: {
          resolvedBy,
          umaResolutionStatus: umaStatus,
          hasDisputeSignal,
        },
      })
    }
  }

  return markets
}

// ---------------------------------------------------------------------------
// Public cached entrypoint — wraps fetch + normalise in unstable_cache so the
// expensive Gamma API crawl runs at most once per 5-minute window. Every
// concurrent page render within that window gets the cached result instantly.
// ---------------------------------------------------------------------------

async function _fetchAllActivePolymarketMarkets(): Promise<NormalizedMarket[]> {
  const events = await fetchActivePolymarketEvents()
  return normalizePolymarketMarkets(events)
}

// NOTE: we deliberately do NOT wrap this in `unstable_cache`. The normalized
// result is ~38MB, which exceeds Next.js's 2MB data-cache item limit — that
// caused every request to throw "items over 2MB can not be cached" and fall
// back to a full refetch + re-score (~8s per request).
//
// Instead we use a process-level in-memory cache with a 5-minute TTL plus
// in-flight de-duplication, so concurrent renders share a single crawl and
// repeat requests within the window are instant. The underlying per-page
// fetches still carry `next: { revalidate: 300 }` as a second layer.
const ACTIVE_TTL_MS = 5 * 60 * 1000
let activeCache: { data: NormalizedMarket[]; expires: number } | null = null
let activeInflight: Promise<NormalizedMarket[]> | null = null

export async function fetchAllActivePolymarketMarkets(): Promise<NormalizedMarket[]> {
  const now = Date.now()
  if (activeCache && activeCache.expires > now) {
    return activeCache.data
  }
  if (activeInflight) {
    return activeInflight
  }

  activeInflight = _fetchAllActivePolymarketMarkets()
    .then((data) => {
      activeCache = { data, expires: Date.now() + ACTIVE_TTL_MS }
      activeInflight = null
      return data
    })
    .catch((err) => {
      activeInflight = null
      // Serve stale data if we have any, rather than failing the whole page.
      if (activeCache) return activeCache.data
      throw err
    })

  return activeInflight
}

// ---------------------------------------------------------------------------
// Single market fetch — used by the detail page so it does NOT need to pull
// the full 500-market list just to render one market. Cached independently
// for 5 min so repeat visits are instant.
// ---------------------------------------------------------------------------

async function _fetchMarketById(id: string): Promise<NormalizedMarket | null> {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${GAMMA_API_BASE}/markets/${encodeURIComponent(id)}`, {
      signal:  controller.signal,
      headers: { Accept: 'application/json' },
      next:    { revalidate: 300 },
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null

    const market = await res.json()
    if (!market || !market.id) return null

    // Wrap in a synthetic event so normalizePolymarketMarkets can process it.
    const syntheticEvent: PolymarketEvent = {
      id:       market.eventId   ?? market.id,
      title:    market.eventTitle ?? '',
      slug:     market.eventSlug  ?? '',
      category: market.category   ?? '',
      markets:  [market],
    }

    const normalised = normalizePolymarketMarkets([syntheticEvent])
    return normalised[0] ?? null
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// unstable_cache with a static key is not per-argument; we wrap it so each
// unique ID gets its own cache slot.
export function fetchMarketById(id: string): Promise<NormalizedMarket | null> {
  return unstable_cache(
    () => _fetchMarketById(id),
    [`polymarket-market-${id}-v1`],
    { revalidate: 300, tags: ['polymarket-markets'] }
  )()
}

// ---------------------------------------------------------------------------
// Resolved (closed) markets — separate fetch so active and resolved are cached
// independently. We cap at 100 to keep response size manageable.
// ---------------------------------------------------------------------------

async function fetchResolvedEventsPage(offset: number): Promise<PolymarketEvent[]> {
  const url = new URL(`${GAMMA_API_BASE}/events`)
  url.searchParams.set('active',    'false')
  url.searchParams.set('closed',    'true')
  url.searchParams.set('limit',     String(PAGE_LIMIT))
  url.searchParams.set('offset',    String(offset))
  url.searchParams.set('order',     'volume')
  url.searchParams.set('ascending', 'false')

  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal:  controller.signal,
      headers: { Accept: 'application/json' },
      cache:   'no-store',   // page payload exceeds 2MB cache limit; cached in-memory instead
    })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`Gamma API responded with ${res.status} at offset ${offset}`)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    clearTimeout(timeoutId)
    return []
  }
}

async function _fetchResolvedPolymarketMarkets(): Promise<NormalizedMarket[]> {
  // One page of 100 resolved markets is enough for the resolved section.
  const events = await fetchResolvedEventsPage(0)
  return normalizePolymarketMarkets(events)
}

// Same in-memory strategy as active markets (avoids the 2MB data-cache limit).
const RESOLVED_TTL_MS = 10 * 60 * 1000
let resolvedCache: { data: NormalizedMarket[]; expires: number } | null = null
let resolvedInflight: Promise<NormalizedMarket[]> | null = null

export async function fetchResolvedPolymarketMarkets(): Promise<NormalizedMarket[]> {
  const now = Date.now()
  if (resolvedCache && resolvedCache.expires > now) {
    return resolvedCache.data
  }
  if (resolvedInflight) {
    return resolvedInflight
  }

  resolvedInflight = _fetchResolvedPolymarketMarkets()
    .then((data) => {
      resolvedCache = { data, expires: Date.now() + RESOLVED_TTL_MS }
      resolvedInflight = null
      return data
    })
    .catch((err) => {
      resolvedInflight = null
      if (resolvedCache) return resolvedCache.data
      throw err
    })

  return resolvedInflight
}
