import { notFound } from 'next/navigation'
import { Nav, PageFooter } from '@/components/nav'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { MarketsListClient } from '@/components/markets/markets-list-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    title: `${label} Markets`,
    description: `Verdict clarity scores for all active Polymarket markets in the ${label} category.`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const all = await fetchAllActivePolymarketMarkets()

  // Match slug back to the original category string (case-insensitive)
  const markets = all.filter(
    (m) => m.eventCategory && m.eventCategory.toLowerCase().replace(/\s+/g, '-') === slug
  )

  if (markets.length === 0) notFound()

  const categoryLabel = markets[0].eventCategory
  const avgScore = Math.round(markets.reduce((s, m) => s + m.score.totalScore, 0) / markets.length)
  const criticalCount = markets.filter((m) => m.score.riskLevel === 'Critical').length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-0">

        {/* Header */}
        <div className="border-b border-border pb-8 mb-8">
          <Link
            href="/markets"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            All Markets
          </Link>
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Category</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-foreground">
            {categoryLabel}
          </h1>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <p className="font-heading text-3xl font-light tabular-nums text-foreground">{markets.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active markets</p>
            </div>
            <div className="w-px bg-border self-stretch" aria-hidden="true" />
            <div>
              <p className="font-heading text-3xl font-light tabular-nums text-foreground">{avgScore}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Avg. clarity score</p>
            </div>
            {criticalCount > 0 && (
              <>
                <div className="w-px bg-border self-stretch" aria-hidden="true" />
                <div>
                  <p className="font-heading text-3xl font-light tabular-nums" style={{ color: 'var(--risk-critical)' }}>
                    {criticalCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Critical risk</p>
                </div>
              </>
            )}
          </div>
        </div>

        <MarketsListClient markets={markets} />

      </main>
      <PageFooter />
    </div>
  )
}
