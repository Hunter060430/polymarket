export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Nav, PageFooter } from '@/components/nav'
import { MarketsListClient } from '@/components/markets/markets-list-client'
import { ResolutionStats } from '@/components/markets/resolution-stats'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { fetchResolvedPolymarketMarkets } from '@/lib/polymarket'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resolved Markets',
  description: 'Browse closed and resolved Polymarket markets with their final Verdict clarity scores.',
}

async function ResolvedContent() {
  try {
    const markets = await fetchResolvedPolymarketMarkets()
    if (markets.length === 0) {
      return (
        <div className="border border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No resolved markets found.</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-8">
        <ResolutionStats markets={markets} />
        <MarketsListClient markets={markets} />
      </div>
    )
  } catch (err) {
    return (
      <div className="flex items-center gap-3 text-sm border border-destructive/40 px-5 py-4 text-destructive">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        Failed to load resolved markets:{' '}
        {err instanceof Error ? err.message : 'Unknown error'}. Please try refreshing.
      </div>
    )
  }
}

function ResolvedSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      <div className="border border-border border-b-0 h-12 animate-pulse bg-secondary/20" />
      <div className="border border-border divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse bg-secondary/10" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  )
}

export default function ResolvedMarketsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12 flex flex-col gap-10">

        {/* Page header */}
        <div className="border-b border-border pb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs tracking-[0.16em] uppercase text-primary">Archive</p>
          </div>
          <h1 className="font-heading text-5xl font-light tracking-tight text-foreground">
            Resolved Markets
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
            Closed and resolved Polymarket markets, preserved with their original Verdict clarity
            scores. Useful for auditing resolution quality after the fact.
          </p>
        </div>

        {/* Tab strip linking back to active */}
        <div className="flex items-center gap-0 border-b border-border -mt-6">
          <Link
            href="/markets"
            className="px-4 py-2.5 text-xs tracking-[0.06em] uppercase text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-border"
          >
            Active Markets
          </Link>
          <span
            className="px-4 py-2.5 text-xs tracking-[0.06em] uppercase text-foreground border-b-2 border-foreground"
            aria-current="page"
          >
            Resolved Markets
          </span>
        </div>

        {/* Notice banner */}
        <div className="flex items-start gap-3 border border-border px-5 py-4 -mt-6">
          <CheckCircle2 className="size-4 shrink-0 text-[var(--risk-low)] mt-0.5" aria-hidden="true" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            These markets have closed. Scores reflect the resolution criteria as written at the time
            of market creation — they are not updated after resolution.
          </p>
        </div>

        <Suspense fallback={<ResolvedSkeleton />}>
          <ResolvedContent />
        </Suspense>

      </main>
      <PageFooter />
    </div>
  )
}
