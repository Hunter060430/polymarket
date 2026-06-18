export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Nav, PageFooter } from '@/components/nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Live Verdict scores for all active Polymarket markets, sorted by lowest clarity score.',
}
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ScoreHistogram } from '@/components/dashboard/score-histogram'
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
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border border border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-6 h-28 animate-pulse bg-secondary/20" />
        ))}
      </div>
      <div className="border border-border h-96 animate-pulse bg-secondary/20" />
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
      <div className="flex items-center gap-3 text-sm border border-destructive/40 px-5 py-4 text-destructive">
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
    <div className="flex flex-col gap-10">
      <StatsCards markets={data.markets} eventCount={data.eventCount} />
      <ScoreHistogram markets={data.markets} />
      <div>
        <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-border mb-0">
          <h2 className="font-heading text-2xl font-light text-foreground">Active Markets</h2>
          <p className="text-xs text-muted-foreground tabular-nums shrink-0">
            Scanned {scannedTime} &middot; sorted by lowest clarity score
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
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10">

        {/* Page header */}
        <div className="border-b border-border pb-6 sm:pb-8">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Live Index</p>
          <h1 className="font-heading text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            Market Clarity Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
            Real-time Verdict scores for all active Polymarket markets — scored across six dimensions of resolution quality.
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
