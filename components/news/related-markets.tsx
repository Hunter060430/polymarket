import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { RiskBadge } from '@/components/risk-badge'
import type { NormalizedMarket } from '@/lib/types'
import { formatVolume } from '@/lib/utils'

export function RelatedMarkets({ markets }: { markets: NormalizedMarket[] }) {
  if (markets.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="font-heading text-2xl font-light text-foreground mb-1">Markets in this story</h2>
      <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">Automatically matched by topic</p>
      <div className="flex flex-col border-t border-border">
        {markets.map((market) => (
          <Link
            key={market.marketId}
            href={`/markets/${market.marketId}`}
            className="group flex items-start justify-between gap-5 border-b border-border py-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <RiskBadge level={market.score.riskLevel} />
                <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
                  {formatVolume(market.volume24hr)} 24h volume
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors text-balance">
                {market.question}
              </h3>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
