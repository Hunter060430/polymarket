import Link from 'next/link'
import { ArrowRight, MessageSquare, Users, Flame } from 'lucide-react'
import { RiskBadge } from '@/components/risk-badge'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { getTrendingMarketIds } from '@/app/actions/community'
import { formatVolume } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'

function riskColor(level: string) {
  return level === 'Low'
    ? 'var(--risk-low)'
    : level === 'Medium'
      ? 'var(--risk-medium)'
      : level === 'High'
        ? 'var(--risk-high)'
        : 'var(--risk-critical)'
}

// Server component. Picks markets the community is actively engaging with
// (comments + risk votes). Falls back to highest-volume High/Critical markets
// when there is not yet enough community activity.
export async function TrendingRiskMarkets() {
  let markets: NormalizedMarket[] = []
  let trending: Awaited<ReturnType<typeof getTrendingMarketIds>> = []

  try {
    ;[markets, trending] = await Promise.all([
      fetchAllActivePolymarketMarkets(),
      getTrendingMarketIds(6),
    ])
  } catch {
    return null
  }

  const byId = new Map(markets.map((m) => [m.marketId, m]))

  type Item = { market: NormalizedMarket; comments: number; votes: number; community: boolean }
  let items: Item[] = trending
    .map((t) => {
      const market = byId.get(t.marketId)
      return market ? { market, comments: t.comments, votes: t.votes, community: true } : null
    })
    .filter((x): x is Item => x !== null)

  // Fallback: not enough community activity yet → seed with riskiest, busiest markets
  if (items.length < 6) {
    const used = new Set(items.map((i) => i.market.marketId))
    const fallback = markets
      .filter(
        (m) =>
          !used.has(m.marketId) &&
          (m.score.riskLevel === 'Critical' || m.score.riskLevel === 'High'),
      )
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6 - items.length)
      .map((market) => ({ market, comments: 0, votes: 0, community: false }))
    items = [...items, ...fallback]
  }

  if (items.length === 0) return null

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex items-end justify-between gap-8 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <Flame className="size-4 text-primary" aria-hidden="true" />
              <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground">Trending Risk Markets</p>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-foreground text-balance">
              Where the community is looking
            </h2>
          </div>
          <Link
            href="/markets"
            className="hidden sm:inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-primary hover:underline underline-offset-4 shrink-0"
          >
            All markets
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
          {items.map(({ market, comments, votes, community }) => {
            const color = riskColor(market.score.riskLevel)
            return (
              <Link
                key={market.marketId}
                href={`/markets/${market.marketId}`}
                className="group flex flex-col gap-4 px-6 py-6 border-b border-r border-border hover:bg-secondary/25 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="font-heading text-3xl font-light tabular-nums leading-none"
                    style={{ color }}
                  >
                    {market.score.totalScore}
                  </span>
                  <RiskBadge level={market.score.riskLevel} />
                </div>

                <p className="text-sm text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors flex-1">
                  {market.question}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {community ? (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="size-3" aria-hidden="true" />
                        {comments}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3" aria-hidden="true" />
                        {votes}
                      </span>
                    </>
                  ) : (
                    <span className="tabular-nums">{formatVolume(market.volume)} Vol</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
