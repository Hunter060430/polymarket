import type { Metadata } from 'next'
import { Nav, PageFooter } from '@/components/nav'
import { WatchlistClient } from '@/components/watchlist/watchlist-client'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'

export const metadata: Metadata = {
  title: 'Watchlist — Verdict',
  description: 'Markets you are tracking on Verdict.',
}

export default async function WatchlistPage() {
  const markets = await fetchAllActivePolymarketMarkets()

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
        <WatchlistClient allMarkets={markets} />
      </main>
      <PageFooter />
    </div>
  )
}
