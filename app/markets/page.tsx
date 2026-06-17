export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Nav, PageFooter } from '@/components/nav'
import { MarketsListClient } from '@/components/markets/markets-list-client'
import { AlertCircle } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse } from '@/lib/types'

async function getMarkets(): Promise<MarketsApiResponse> {
  const markets = await fetchAllActivePolymarketMarkets()
  const uniqueEventIds = new Set(markets.map((m) => m.eventId))
  return {
    scannedAt: new Date().toISOString(),
    eventCount: uniqueEventIds.size,
    marketCount: markets.length,
    markets,
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

export default function MarketsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12 flex flex-col gap-10">
        <div className="border-b border-border pb-8">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Market Browser</p>
          <h1 className="font-heading text-5xl font-light tracking-tight text-foreground">
            All Active Markets
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
            Filter, sort, and browse all active Polymarket markets by rule clarity score, risk level, volume, and end date.
          </p>
        </div>
        <Suspense fallback={<MarketsSkeleton />}>
          <MarketsContent />
        </Suspense>
      </main>
      <PageFooter />
    </div>
  )
}
