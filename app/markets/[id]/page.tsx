export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Nav, PageFooter } from '@/components/nav'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RiskBadge } from '@/components/risk-badge'
import { ScoreGauge } from '@/components/score-gauge'
import { ScoreBreakdown } from '@/components/markets/score-breakdown'
import { RawJsonPanel } from '@/components/markets/raw-json-panel'
import { ExternalLink, Calendar, DollarSign, Droplets, FileText } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { formatVolume } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'

async function getMarket(id: string): Promise<NormalizedMarket | null> {
  const markets = await fetchAllActivePolymarketMarkets()
  return markets.find((m) => m.marketId === id) ?? null
}

function formatDetailDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return '—'
  }
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) notFound()

  const { score } = market

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {market.eventCategory && (
              <Badge variant="secondary" className="text-xs font-normal uppercase tracking-wide">
                {market.eventCategory}
              </Badge>
            )}
            <RiskBadge level={score.riskLevel} />
          </div>
          <h1 className="font-heading text-2xl font-light leading-snug text-foreground text-balance">
            {market.question}
          </h1>
          {market.eventTitle && (
            <p className="text-sm text-muted-foreground">
              Event: {market.eventTitle}
            </p>
          )}
        </div>

        <Separator />

        {/* Score + Summary — horizontal layout with score on left */}
        <div className="flex items-start gap-8">
          <div className="shrink-0 flex flex-col items-center gap-2">
            <ScoreGauge score={score.totalScore} riskLevel={score.riskLevel} size="lg" />
            <p className="text-xs text-muted-foreground">out of 100</p>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div>
              <p className="font-heading text-lg font-light text-foreground">
                {score.riskLevel} Risk — {score.totalScore}/100
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {score.riskLevel === 'Low' &&
                  'Resolution criteria are well-specified with low post-trade dispute risk.'}
                {score.riskLevel === 'Medium' &&
                  'Some ambiguity present. Human review recommended before large positions.'}
                {score.riskLevel === 'High' &&
                  'Significant rule clarity concerns. Material dispute risk exists.'}
                {score.riskLevel === 'Critical' &&
                  'Resolution criteria are substantially underspecified. High dispute risk.'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{score.summary}</p>
            {score.flags.length > 0 && (
              <ul className="flex flex-col gap-1.5 mt-1">
                {score.flags.map((flag, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                  >
                    <span
                      className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0"
                      aria-hidden="true"
                    />
                    {flag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Separator />

        {/* Score Breakdown */}
        <div>
          <h2 className="font-heading text-xl font-light text-foreground mb-1">
            Score Breakdown
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Scores across six weighted criteria</p>
          <ScoreBreakdown breakdown={score.breakdown} />
        </div>

        <Separator />

        {/* Market Details */}
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-xl font-light text-foreground">Market Details</h2>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <DollarSign className="size-3" aria-hidden="true" /> Volume
              </p>
              <p className="text-sm font-medium tabular-nums">{formatVolume(market.volume)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Droplets className="size-3" aria-hidden="true" /> Liquidity
              </p>
              <p className="text-sm font-medium tabular-nums">{formatVolume(market.liquidity)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="size-3" aria-hidden="true" /> End Date
              </p>
              <p className="text-sm font-medium">{formatDetailDate(market.endDate)}</p>
            </div>
          </div>

          <Separator />

          {/* Resolution Source */}
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
              <FileText className="size-3" aria-hidden="true" /> Resolution Source
            </p>
            {market.resolutionSource ? (
              <p className="text-sm leading-relaxed">{market.resolutionSource}</p>
            ) : (
              <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                Not specified
              </Badge>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-foreground mb-2 uppercase tracking-wide">
              Description
            </p>
            {market.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {market.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided.</p>
            )}
          </div>

          <Separator />

          {/* Outcomes */}
          <div>
            <p className="text-xs font-medium text-foreground mb-3 uppercase tracking-wide">
              Outcomes
            </p>
            <div className="flex flex-wrap gap-2">
              {market.outcomes.map((outcome, i) => (
                <div
                  key={outcome}
                  className="flex items-center gap-2 border border-border px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{outcome}</span>
                  {market.outcomePrices[i] !== undefined && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {(market.outcomePrices[i] * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {market.marketSlug && (
            <>
              <Separator />
              <a
                href={`https://polymarket.com/market/${market.marketSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                View on Polymarket
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </>
          )}
        </div>

        {/* Raw JSON */}
        <RawJsonPanel market={market} />
      </main>
      <PageFooter />
    </div>
  )
}
