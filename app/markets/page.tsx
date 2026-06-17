export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
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

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

async function MarketsContent() {
  try {
    const data = await getMarkets()
    return <MarketsListClient markets={data.markets} />
  } catch (err) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive border border-destructive/30 px-4 py-3">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        Failed to load market data:{' '}
        {err instanceof Error ? err.message : 'Unknown error'}. Please try refreshing.
      </div>
    )
  }
}

export default function MarketsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8 flex flex-col gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-2">
            Market Browser
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground">
            All Markets
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Browse and filter all scanned Polymarket markets by risk level, volume, and clarity score.
          </p>
        </div>
        <Suspense fallback={<ListSkeleton />}>
          <MarketsContent />
        </Suspense>
      </main>
      <PageFooter />
    </div>
  )
}
