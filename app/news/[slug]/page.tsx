export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { getNewsBySlug } from '@/app/actions/news'
import { ArrowLeft } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  update:       'Update',
  feature:      'Feature',
  analysis:     'Analysis',
  announcement: 'Announcement',
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

        <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          Written by {post.authorName}
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
