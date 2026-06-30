// Do NOT fetch markets here — passing 500 NormalizedMarket objects through RSC
// props serialises ~39 MB into the .rsc payload, exceeding Vercel's 19 MB limit.
// WatchlistClient fetches its own data via /api/markets.
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Nav, PageFooter } from '@/components/nav'
import { WatchlistClient } from '@/components/watchlist/watchlist-client'

export const metadata: Metadata = {
  title: 'Watchlist — Verdict',
  description: 'Markets you are tracking on Verdict.',
}

export default function WatchlistPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Markets you have starred. Stored locally in your browser.
          </p>
        </div>
        <WatchlistClient />
      </main>
      <PageFooter />
    </div>
  )
}
