export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Nav, PageFooter } from '@/components/nav'
import { RiskBadge } from '@/components/risk-badge'
import { ScoreBreakdown } from '@/components/markets/score-breakdown'
import { RawJsonPanel } from '@/components/markets/raw-json-panel'
import { ExternalLink, Calendar, DollarSign, Droplets, FileText, ArrowLeft } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { formatVolume } from '@/lib/utils'
import Link from 'next/link'
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

  const scoreColor =
    score.riskLevel === 'Low'      ? 'var(--risk-low)' :
    score.riskLevel === 'Medium'   ? 'var(--risk-medium)' :
    score.riskLevel === 'High'     ? 'var(--risk-high)' :
    'var(--risk-critical)'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12 flex flex-col gap-0">

        {/* ── Breadcrumb ─────────────────────────────────── */}
        <div className="border-b border-border pb-6 mb-10">
          <Link
            href="/markets"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            All Markets
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {market.eventCategory && (
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground border border-border px-2 py-0.5">
                {market.eventCategory}
              </span>
            )}
            <RiskBadge level={score.riskLevel} />
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-light leading-tight text-foreground text-balance">
            {market.question}
          </h1>

          {market.eventTitle && (
            <p className="text-sm text-muted-foreground mt-3">
              Event: {market.eventTitle}
            </p>
          )}
        </div>

        {/* ── Score hero ─────────────────────────────────── */}
        <section className="border-b border-border pb-10 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 sm:gap-12 items-start">

            {/* Big score number */}
            <div className="flex flex-col items-center gap-1 sm:border-r sm:border-border sm:pr-12">
              <span
                className="font-heading leading-none tabular-nums"
                style={{ fontSize: 'clamp(4rem, 10vw, 7rem)', color: scoreColor, fontWeight: 300 }}
                aria-label={`Clarity score: ${score.totalScore} out of 100`}
              >
                {score.totalScore}
              </span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">out of 100</span>
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-heading text-2xl font-light" style={{ color: scoreColor }}>
                  {score.riskLevel} Risk
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {score.riskLevel === 'Low'      && 'Resolution criteria are well-specified with low post-trade dispute risk.'}
                  {score.riskLevel === 'Medium'   && 'Some ambiguity present. Human review recommended before large positions.'}
                  {score.riskLevel === 'High'     && 'Significant rule clarity concerns. Material dispute risk exists.'}
                  {score.riskLevel === 'Critical' && 'Resolution criteria are substantially underspecified. High dispute risk.'}
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{score.summary}</p>

              {score.flags.length > 0 && (
                <ul className="flex flex-col gap-2 border-l-2 pl-4" style={{ borderColor: scoreColor }}>
                  {score.flags.map((flag, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ── Score Breakdown ────────────────────────────── */}
        <section className="border-b border-border pb-10 mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-1">Score Breakdown</h2>
          <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">Six weighted criteria</p>
          <ScoreBreakdown breakdown={score.breakdown} />
        </section>

        {/* ── Market Details ─────────────────────────────── */}
        <section className="border-b border-border pb-10 mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-6">Market Details</h2>

          {/* Metadata strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border border border-border mb-8">
            <div className="px-5 py-4">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <DollarSign className="size-3" aria-hidden="true" />Volume
              </p>
              <p className="font-heading text-2xl font-light tabular-nums">{formatVolume(market.volume)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <Droplets className="size-3" aria-hidden="true" />Liquidity
              </p>
              <p className="font-heading text-2xl font-light tabular-nums">{formatVolume(market.liquidity)}</p>
            </div>
            <div className="px-5 py-4 col-span-2">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="size-3" aria-hidden="true" />End Date
              </p>
              <p className="text-sm font-medium">{formatDetailDate(market.endDate)}</p>
            </div>
          </div>

          {/* Resolution Source */}
          <div className="border-b border-border pb-6 mb-6">
            <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
              <FileText className="size-3" aria-hidden="true" />Resolution Source
            </p>
            {market.resolutionSource ? (
              <p className="text-sm leading-relaxed text-foreground">{market.resolutionSource}</p>
            ) : (
              <span className="text-xs text-destructive border border-destructive/30 px-3 py-1 inline-block">
                Not specified
              </span>
            )}
          </div>

          {/* Description */}
          <div className="border-b border-border pb-6 mb-6">
            <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">Description</p>
            {market.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {market.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided.</p>
            )}
          </div>

          {/* Outcomes */}
          <div>
            <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-4">Outcomes</p>
            <div className="flex flex-wrap gap-2">
              {market.outcomes.map((outcome, i) => (
                <div
                  key={outcome}
                  className="flex items-center gap-3 border border-border px-4 py-2.5"
                >
                  <span className="text-sm font-medium tracking-wide">{outcome}</span>
                  {market.outcomePrices[i] !== undefined && (
                    <span
                      className="text-sm font-heading font-light tabular-nums"
                      style={{ color: scoreColor }}
                    >
                      {(market.outcomePrices[i] * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── External link ─────────────────────────────── */}
        {market.marketSlug && (
          <div className="border-b border-border pb-10 mb-10">
            <a
              href={`https://polymarket.com/market/${market.marketSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs tracking-[0.08em] uppercase text-primary hover:underline underline-offset-4"
            >
              View on Polymarket
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* ── Raw JSON ──────────────────────────────────── */}
        <RawJsonPanel market={market} />

      </main>
      <PageFooter />
    </div>
  )
}
