'use client'

import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'
import { RiskBadge } from '@/components/risk-badge'
import { formatVolume, cn } from '@/lib/utils'
import type { SimilarMarket } from '@/lib/similarity'

interface SimilarMarketsProps {
  items: SimilarMarket[]
}

export function SimilarMarkets({ items }: SimilarMarketsProps) {
  if (items.length === 0) {
    return (
      <section aria-labelledby="similar-heading" className="border border-border">
        <div className="border-b border-border px-4 py-3 flex items-center gap-2">
          <GitCompareArrows className="size-4 text-primary" aria-hidden="true" />
          <h2 id="similar-heading" className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground">
            Similar Markets
          </h2>
        </div>
        <p className="px-4 py-6 text-sm text-muted-foreground">No similar markets found in the current dataset.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="similar-heading" className="border border-border">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <GitCompareArrows className="size-4 text-primary" aria-hidden="true" />
        <h2 id="similar-heading" className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground">
          Similar Markets
        </h2>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{items.length} found</span>
      </div>

      <ul className="divide-y divide-border">
        {items.map(({ market, similarity, sharedTerms }) => (
          <li key={market.marketId}>
            <Link
              href={`/markets/${market.marketId}`}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/20 transition-colors group"
            >
              {/* Similarity bar */}
              <div className="shrink-0 flex flex-col items-center gap-1 mt-0.5" aria-hidden="true">
                <div className="w-1.5 h-10 bg-border rounded-full overflow-hidden">
                  <div
                    className="w-full bg-primary rounded-full transition-all"
                    style={{ height: `${Math.round(similarity * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {Math.round(similarity * 100)}%
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
                  {market.question}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <RiskBadge level={market.score.riskLevel} />

                  {market.eventCategory && (
                    <span className="text-xs text-muted-foreground">{market.eventCategory}</span>
                  )}

                  <span className="text-xs text-muted-foreground tabular-nums">
                    Vol {formatVolume(market.volume)}
                  </span>

                  {sharedTerms.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Shares: {sharedTerms.slice(0, 3).map((t) => (
                        <span key={t} className={cn(
                          'inline-block mr-1 px-1 py-0 bg-secondary text-foreground rounded-sm text-[10px]'
                        )}>{t}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs text-muted-foreground tabular-nums shrink-0 mt-0.5">
                {market.score.totalScore}/100
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
