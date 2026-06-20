export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Nav, PageFooter } from '@/components/nav'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketsListClient } from '@/components/markets/markets-list-client'
import { AlertCircle } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse } from '@/lib/types'
import AskAIPanel from '@/components/markets/ask-ai-panel'

// ── Dynamic metadata ──────────────────────────────────────────────────────────

type SearchParams = Record<string, string | string[] | undefined>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const sp  = await searchParams
  const q    = typeof sp.q    === 'string' ? sp.q    : ''
  const risk = typeof sp.risk === 'string' ? sp.risk : ''

  let description = 'Browse and filter all active Polymarket markets by Verdict clarity score, risk level, volume, and end date.'

  if (q && risk && risk !== 'all') {
    description = `Showing ${risk}-risk Polymarket markets matching "${q}" — scored by Verdict for resolution clarity.`
  } else if (q) {
    description = `Polymarket markets matching "${q}" — scored by Verdict for rule clarity and resolution risk.`
  } else if (risk && risk !== 'all') {
    description = `Browsing ${risk}-risk Polymarket markets — scored by Verdict for resolution clarity and dispute potential.`
  }

  return {
    title: q ? `Markets: "${q}"` : risk && risk !== 'all' ? `${risk} Risk Markets` : 'Markets',
    description,
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getMarkets(): Promise<MarketsApiResponse> {
  const markets = await fetchAllActivePolymarketMarkets()
  const uniqueEventIds = new Set(markets.map((m) => m.eventId))

  // The list view renders ~8600 rows but only needs a handful of fields. The
  // full objects (~38MB) include long `description` text and per-dimension
  // `trace`/`dimensionDetails` that the list never reads — serializing all of
  // that into the RSC payload was the dominant cost (multi-second warm loads).
  // Strip the heavy fields here so the client receives a lean payload; the
  // detail page fetches the complete market on demand via fetchMarketById.
  const slim = markets.map((m) => ({
    ...m,
    description: '',
    resolutionSource: '',
    clobTokenIds: [],
    score: {
      ...m.score,
      trace: undefined,
      dimensionDetails: undefined,
    },
  }))

  return {
    scannedAt: new Date().toISOString(),
    eventCount: uniqueEventIds.size,
    marketCount: markets.length,
    markets: slim,
  }
}

async function MarketsContent() {
  try {
    const data = await getMarkets()
    return <MarketsListClient markets={data.markets} />
  } catch (err) {
    return (
      <div className="flex items-center gap-3 text-sm border border-destructive/40 px-5 py-4 text-destructive">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        Failed to load market data:{' '}
        {err instanceof Error ? err.message : 'Unknown error'}. Please try refreshing.
      </div>
    )
  }
}

function MarketsSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      <div className="border border-border border-b-0 h-12 animate-pulse bg-secondary/20" />
      <div className="border border-border divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse bg-secondary/10"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10">
        <div className="border-b border-border pb-6 sm:pb-8">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Market Browser</p>
          <h1 className="font-heading text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            All Active Markets
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
            Filter, sort, and browse all active Polymarket markets by rule clarity score, risk level, volume, and end date.
          </p>
        </div>
        {/* Tab strip */}
        <div className="flex items-center gap-0 border-b border-border -mt-4 sm:-mt-6">
          <span
            className="px-4 py-2.5 text-xs tracking-[0.06em] uppercase text-foreground border-b-2 border-foreground"
            aria-current="page"
          >
            Active Markets
          </span>
          <Link
            href="/markets/resolved"
            className="px-4 py-2.5 text-xs tracking-[0.06em] uppercase text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-border"
          >
            Resolved Markets
          </Link>
        </div>

        <Suspense fallback={<MarketsSkeleton />}>
          <MarketsContent />
        </Suspense>
      </main>
      <PageFooter />
      <AskAIPanel />
    </div>
  )
}
