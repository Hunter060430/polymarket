import { notFound } from 'next/navigation'
import { Nav, PageFooter } from '@/components/nav'
import { RiskBadge } from '@/components/risk-badge'
import { ScoreBreakdown } from '@/components/markets/score-breakdown'
import { ShareButton } from '@/components/markets/share-button'
import { ExternalLink, Calendar, DollarSign, Droplets, FileText, ArrowLeft, ArrowRight } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { formatVolume } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { NormalizedMarket } from '@/lib/types'

// Per-page fetch — still uses the shared cached result so no extra API calls
async function getMarket(id: string): Promise<NormalizedMarket | null> {
  const markets = await fetchAllActivePolymarketMarkets()
  return markets.find((m) => m.marketId === id) ?? null
}

async function getRelated(market: NormalizedMarket): Promise<NormalizedMarket[]> {
  const markets = await fetchAllActivePolymarketMarkets()
  return markets
    .filter(
      (m) =>
        m.marketId !== market.marketId &&
        (m.eventCategory === market.eventCategory ||
          m.score.riskLevel === market.score.riskLevel)
    )
    .sort((a, b) => a.score.totalScore - b.score.totalScore)
    .slice(0, 4)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) return { title: 'Market Not Found' }

  const { score } = market
  const title = market.question.length > 70
    ? market.question.slice(0, 67) + '…'
    : market.question

  return {
    title,
    description: `Verdict score ${score.totalScore}/100 — ${score.riskLevel} Risk. ${score.summary.slice(0, 140)}`,
    openGraph: {
      title: `${title} — Verdict`,
      description: `Clarity score: ${score.totalScore}/100 (${score.riskLevel} Risk). ${score.flags[0] ?? ''}`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${title} — Verdict`,
      description: `Clarity score: ${score.totalScore}/100 (${score.riskLevel} Risk).`,
    },
  }
}

function formatDetailDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    })
  } catch { return '—' }
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [market, related] = await Promise.all([
    getMarket(id),
    getMarket(id).then((m) => (m ? getRelated(m) : [])),
  ])
  if (!market) notFound()

  const { score } = market
  const scoreColor =
    score.riskLevel === 'Low'      ? 'var(--risk-low)'      :
    score.riskLevel === 'Medium'   ? 'var(--risk-medium)'   :
    score.riskLevel === 'High'     ? 'var(--risk-high)'     :
    'var(--risk-critical)'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-0">

        {/* ── Breadcrumb ─────────────────────────────────── */}
        <div className="border-b border-border pb-6 mb-8 sm:mb-10">
          <Link
            href="/markets"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            All Markets
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {market.eventCategory && (
              <Link
                href={`/markets/category/${encodeURIComponent(market.eventCategory.toLowerCase())}`}
                className="text-xs tracking-[0.12em] uppercase text-muted-foreground border border-border px-2 py-0.5 hover:text-foreground hover:border-foreground transition-colors"
              >
                {market.eventCategory}
              </Link>
            )}
            <RiskBadge level={score.riskLevel} />
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light leading-tight text-foreground text-balance mb-3">
            {market.question}
          </h1>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            {market.eventTitle && (
              <p className="text-sm text-muted-foreground">Event: {market.eventTitle}</p>
            )}
            <ShareButton question={market.question} />
          </div>
        </div>

        {/* ── Score hero ─────────────────────────────────── */}
        <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-12 items-start">
            <div className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-1 sm:border-r sm:border-border sm:pr-12">
              <span
                className="font-heading leading-none tabular-nums"
                style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', color: scoreColor, fontWeight: 300 }}
                aria-label={`Clarity score: ${score.totalScore} out of 100`}
              >
                {score.totalScore}
              </span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">out of 100</span>
            </div>

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
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">{flag}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ── Score Breakdown ────────────────────────────── */}
        <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-1">Score Breakdown</h2>
          <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">Six weighted criteria</p>
          <ScoreBreakdown breakdown={score.breakdown} dimensionDetails={score.dimensionDetails} />
        </section>

        {/* ── Market Details ─────────────────────────────── */}
        <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-6">Market Details</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border border border-border mb-8">
            <div className="px-4 sm:px-5 py-4">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <DollarSign className="size-3" aria-hidden="true" />Volume
              </p>
              <p className="font-heading text-xl sm:text-2xl font-light tabular-nums">{formatVolume(market.volume)}</p>
            </div>
            <div className="px-4 sm:px-5 py-4">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <Droplets className="size-3" aria-hidden="true" />Liquidity
              </p>
              <p className="font-heading text-xl sm:text-2xl font-light tabular-nums">{formatVolume(market.liquidity)}</p>
            </div>
            <div className="px-4 sm:px-5 py-4 col-span-2">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="size-3" aria-hidden="true" />End Date
              </p>
              <p className="text-sm font-medium">{formatDetailDate(market.endDate)}</p>
            </div>
          </div>

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

          <div className="border-b border-border pb-6 mb-6">
            <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">Description</p>
            {market.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{market.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided.</p>
            )}
          </div>

          <div>
            <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-4">Outcomes</p>
            <div className="flex flex-wrap gap-2">
              {market.outcomes.map((outcome, i) => (
                <div key={outcome} className="flex items-center gap-3 border border-border px-4 py-2.5">
                  <span className="text-sm font-medium tracking-wide">{outcome}</span>
                  {market.outcomePrices[i] !== undefined && (
                    <span className="text-sm font-heading font-light tabular-nums" style={{ color: scoreColor }}>
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
          <div className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
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

        {/* ── Related Markets ───────────────────────────── */}
        {related.length > 0 && (
          <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
            <h2 className="font-heading text-2xl font-light text-foreground mb-1">Related Markets</h2>
            <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">
              Same category or risk level
            </p>
            <div className="flex flex-col border border-border border-b-0">
              {related.map((rel) => {
                const relColor =
                  rel.score.riskLevel === 'Low'      ? 'var(--risk-low)'      :
                  rel.score.riskLevel === 'Medium'   ? 'var(--risk-medium)'   :
                  rel.score.riskLevel === 'High'     ? 'var(--risk-high)'     :
                  'var(--risk-critical)'
                return (
                  <Link
                    key={rel.marketId}
                    href={`/markets/${rel.marketId}`}
                    className="flex items-center gap-4 px-4 py-3.5 border-b border-border hover:bg-secondary/25 transition-colors group"
                  >
                    <span
                      className="font-heading text-2xl font-light tabular-nums shrink-0 w-8 text-center"
                      style={{ color: relColor }}
                    >
                      {rel.score.totalScore}
                    </span>
                    <div className="w-px self-stretch bg-border shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">{rel.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <RiskBadge level={rel.score.riskLevel} />
                        {rel.eventCategory && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">{rel.eventCategory}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </main>
      <PageFooter />
    </div>
  )
}
