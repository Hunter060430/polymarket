export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Nav, PageFooter } from '@/components/nav'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { MarketsTable } from '@/components/dashboard/markets-table'
import { AlertCircle } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { MarketsApiResponse } from '@/lib/types'

async function getDashboardData(): Promise<MarketsApiResponse> {
  const markets = await fetchAllActivePolymarketMarkets()
  const uniqueEventIds = new Set(markets.map((m) => m.eventId))
  return {
    scannedAt: new Date().toISOString(),
    eventCount: uniqueEventIds.size,
    marketCount: markets.length,
    markets,
  }
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

async function DashboardContent() {
  let data: MarketsApiResponse
  try {
    data = await getDashboardData()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return (
      <div className="flex items-center gap-2 text-sm text-destructive border border-destructive/30 px-4 py-3">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        Failed to load market data: {msg}. Please try refreshing.
      </div>
    )
  }

  const sorted = [...data.markets].sort((a, b) => a.score.totalScore - b.score.totalScore)
  const scannedTime = new Date(data.scannedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className="flex flex-col gap-8">
      <StatsCards markets={data.markets} eventCount={data.eventCount} />
      <div>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-xl font-light text-foreground">Active Markets</h2>
          <p className="text-xs text-muted-foreground tabular-nums shrink-0">
            Scanned at {scannedTime} &mdash; sorted by lowest clarity score
          </p>
        </div>
        <MarketsTable markets={sorted} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8 flex flex-col gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-2">
            Live Index
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground">
            Prediction Market Rule Clarity Index
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
            Independent heuristic analysis of active Polymarket markets — scored on time clarity, resolution source quality, outcome definition, evidence standards, edge case handling, and post-trade risk.
          </p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
      <PageFooter />
    </div>
  )
}
