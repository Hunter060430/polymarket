import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { MatchableNewsPost } from '@/lib/news-market-matcher'

export function RelatedNews({ posts }: { posts: MatchableNewsPost[] }) {
  if (posts.length === 0) return null

  return (
    <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
      <h2 className="font-heading text-2xl font-light text-foreground mb-1">Related News</h2>
      <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">Matched by topic and entities</p>
      <div className="flex flex-col border-t border-border">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/news/${post.slug}`}
            className="group flex items-start justify-between gap-5 border-b border-border py-5"
          >
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-2">{post.category}</p>
              <h3 className="font-heading text-lg font-light text-foreground group-hover:text-primary transition-colors text-balance">
                {post.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{post.summary}</p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
