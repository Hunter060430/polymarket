'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useWatchlist } from '@/hooks/use-watchlist'
import { StarButton } from '@/components/markets/star-button'
import { RiskBadge } from '@/components/risk-badge'
import type { NormalizedMarket } from '@/lib/types'
import { formatVolume, polymarketUrl } from '@/lib/utils'
import { Star, ExternalLink } from 'lucide-react'

interface WatchlistClientProps {
  allMarkets: NormalizedMarket[]
}

export function WatchlistClient({ allMarkets }: WatchlistClientProps) {
  const { watchlist } = useWatchlist()
  const [hydrated, setHydrated] = useState(false)

  // Wait for localStorage hydration before rendering to avoid SSR mismatch
  useEffect(() => { setHydrated(true) }, [])

  const starred = useMemo(
    () => allMarkets.filter((m) => watchlist.has(m.marketId)),
    [allMarkets, watchlist],
  )

  if (!hydrated) {
    return (
      <div className="border border-border py-20 text-center">
        <p className="text-sm text-muted-foreground">Loading watchlist…</p>
      </div>
    )
  }

  if (starred.length === 0) {
    return (
      <div className="border border-border py-20 text-center flex flex-col items-center gap-4">
        <Star className="size-8 text-muted-foreground/30" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">No markets starred yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Star any market from the{' '}
            <Link href="/markets" className="underline underline-offset-4 hover:text-foreground">
              Markets
            </Link>{' '}
            page to track it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4 tabular-nums">
        {starred.length} {starred.length === 1 ? 'market' : 'markets'} starred
      </p>
      <ul className="border border-border divide-y divide-border">
        {starred.map((market) => {
          const { score } = market
          const yesIdx = market.outcomes.findIndex(
            (o) => o.toLowerCase() === 'yes',
          )
          const yesPrice = yesIdx >= 0 ? market.outcomePrices[yesIdx] : null
          return (
            <li key={market.marketId} className="flex items-start gap-3 px-4 py-4 hover:bg-secondary/20 transition-colors">
              {/* Star toggle */}
              <StarButton
                marketId={market.marketId}
                className="mt-0.5"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/markets/${market.marketId}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
                  >
                    {market.question}
                  </Link>
                  <div className="shrink-0 flex items-center gap-2">
                    <RiskBadge level={score.riskLevel} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  {/* Category */}
                  {market.eventCategory && (
                    <span className="text-xs text-muted-foreground">
                      {market.eventCategory}
                    </span>
                  )}

                  {/* Yes probability */}
                  {yesPrice !== null && (
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      YES {Math.round(yesPrice * 100)}%
                    </span>
                  )}

                  {/* Volume */}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Vol {formatVolume(market.volume)}
                  </span>

                  {/* External link */}
                  <a
                    href={polymarketUrl(market.marketSlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="View on Polymarket"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3" aria-hidden="true" />
                    Polymarket
                  </a>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
