// Compare page must NOT pass the full market list through RSC props — doing so
// serialises ~500 NormalizedMarket objects into the .rsc payload (37 MB) which
// exceeds Vercel's 19 MB ISR limit. Instead, the client fetches its own data
// via the /api/markets endpoint so no market data appears in the RSC payload.
export const dynamic = 'force-dynamic'

import { Nav, PageFooter } from '@/components/nav'
import type { Metadata } from 'next'
import { CompareClient } from '@/components/compare/compare-client'

export const metadata: Metadata = {
  title: 'Compare Markets',
  description:
    'Compare up to four Polymarket markets side by side — clarity score, six scoring dimensions, current price, and volume. Built for arbitrage and portfolio decisions.',
}

export default function ComparePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="border-b border-border pb-6 mb-8">
          <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-3">Tools</p>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light leading-tight text-foreground text-balance mb-3">
            Compare Markets
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Add up to four markets to compare their clarity scores across all six dimensions
            side by side. Ideal for evaluating arbitrage pairs or building a position across
            correlated markets.
          </p>
        </div>

        {/* No server data passed — CompareClient fetches /api/markets itself */}
        <CompareClient />
      </main>
      <PageFooter />
    </div>
  )
}
