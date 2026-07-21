export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { getNewsBySlug } from '@/app/actions/news'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { findMarketsForNews } from '@/lib/news-market-matcher'
import { RelatedMarkets } from '@/components/news/related-markets'
import { ArrowLeft } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  news: 'News',
  analysis: 'Analysis',
  'product-update': 'Product Update',
  update: 'News',
  feature: 'Product Update',
  announcement: 'News',
}

function formatDate(date: Date | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getNewsBySlug(slug)
  if (!post) return { title: 'Not Found — Verdict' }
  return {
    title: `${post.title} — Verdict`,
    description: post.summary,
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getNewsBySlug(slug)
  if (!post) notFound()

  const relatedMarkets = await fetchAllActivePolymarketMarkets()
    .then((markets) => {
      const excludedIds = new Set(post.overrides.filter((item) => item.mode === 'exclude').map((item) => item.marketId))
      const includedIds = new Set(post.overrides.filter((item) => item.mode === 'include').map((item) => item.marketId))
      const pinned = markets.filter((market) => includedIds.has(market.marketId))
      const automatic = findMarketsForNews(post, markets.filter((market) => !excludedIds.has(market.marketId) && !includedIds.has(market.marketId)), 4)
      return [...pinned, ...automatic].slice(0, 4)
    })
    .catch(() => [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          All news
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] tracking-[0.1em] uppercase border border-border px-2 py-0.5 text-muted-foreground">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</span>
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-light text-foreground text-balance mb-4">
          {post.title}
        </h1>

        <p className="text-sm text-muted-foreground border-l-2 border-border pl-4 py-1 mb-8 leading-relaxed">
          {post.summary}
        </p>

        <div className="prose prose-sm prose-neutral max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
          {post.body}
        </div>

        {post.sourceUrl && post.sourceName && (
          <aside className="mt-10 border-y border-border py-5" aria-label="Source">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Primary source</p>
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              {post.sourceName}
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Reported {formatDate(post.reportedAt)} · Verified {formatDate(post.verifiedAt)}
            </p>
          </aside>
        )}

        <RelatedMarkets markets={relatedMarkets} />

        <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          Written by {post.authorName}
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
