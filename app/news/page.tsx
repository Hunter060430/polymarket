export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { getPublishedNews } from '@/app/actions/news'

export const metadata: Metadata = {
  title: 'News — Verdict',
  description: 'Updates, feature releases, and analysis from the Verdict team.',
}

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
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export default async function NewsPage() {
  const posts = await getPublishedNews()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="border-b border-border pb-6 mb-10">
          <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-3">Verdict</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-light text-foreground text-balance">
            News
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Verified reporting, independent analysis, and product updates — clearly labeled and sourced.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet. Check back soon.</p>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/news/${post.slug}`}
                  className="block py-7 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] tracking-[0.1em] uppercase border border-border px-2 py-0.5 text-muted-foreground">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-medium text-foreground group-hover:underline underline-offset-4 text-balance mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {post.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <PageFooter />
    </div>
  )
}
