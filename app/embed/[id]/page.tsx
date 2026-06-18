import { notFound } from 'next/navigation'
import { fetchAllActivePolymarketMarkets, fetchMarketById } from '@/lib/polymarket'
import { polymarketUrl } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// Embeds must be framable from any origin.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

async function resolveMarket(id: string): Promise<NormalizedMarket | null> {
  let market = await fetchMarketById(id)
  if (!market) {
    const all = await fetchAllActivePolymarketMarkets()
    market = all.find((m) => m.marketId === id || m.conditionId === id || m.marketSlug === id) ?? null
  }
  return market
}

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const market = await resolveMarket(id)
  if (!market) notFound()

  const { score } = market
  const color =
    score.riskLevel === 'Low'      ? 'var(--risk-low)'      :
    score.riskLevel === 'Medium'   ? 'var(--risk-medium)'   :
    score.riskLevel === 'High'     ? 'var(--risk-high)'     :
    'var(--risk-critical)'

  const appUrl = `https://verdict.app/markets/${market.marketId}`

  return (
    <div className="bg-background text-foreground font-sans p-4 min-h-screen flex items-center">
      <a
        href={appUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full border border-border hover:border-primary/50 transition-colors"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="font-heading text-sm font-light tracking-tight">Verdict</span>
          <span className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
            Clarity Score
          </span>
        </div>

        {/* Body */}
        <div className="flex items-center gap-4 px-4 py-4">
          {/* Score dial */}
          <div className="shrink-0 flex flex-col items-center">
            <span className="font-heading text-4xl font-light tabular-nums leading-none" style={{ color }}>
              {score.totalScore}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">/ 100</span>
          </div>

          {/* Question + risk */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground leading-snug line-clamp-2 mb-2">{market.question}</p>
            <span
              className="inline-block text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 border"
              style={{ color, borderColor: color }}
            >
              {score.riskLevel} Risk
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">View full analysis →</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
            {polymarketUrl(market.marketSlug).replace('https://', '').split('?')[0]}
          </span>
        </div>
      </a>
    </div>
  )
}
