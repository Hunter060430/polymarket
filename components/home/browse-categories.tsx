import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import type { NormalizedMarket } from '@/lib/types'

function slugify(category: string) {
  return category.toLowerCase().replace(/\s+/g, '-')
}

// Server component. Aggregates live market categories with counts + average
// clarity score so visitors can jump straight into a topic.
export async function BrowseCategories() {
  let markets: NormalizedMarket[] = []
  try {
    markets = await fetchAllActivePolymarketMarkets()
  } catch {
    return null
  }

  const map = new Map<string, { count: number; scoreSum: number; critical: number }>()
  for (const m of markets) {
    if (!m.eventCategory) continue
    const e = map.get(m.eventCategory) ?? { count: 0, scoreSum: 0, critical: 0 }
    e.count += 1
    e.scoreSum += m.score.totalScore
    if (m.score.riskLevel === 'Critical') e.critical += 1
    map.set(m.eventCategory, e)
  }

  const categories = Array.from(map.entries())
    .map(([name, e]) => ({
      name,
      count: e.count,
      avg: Math.round(e.scoreSum / e.count),
      critical: e.critical,
    }))
    .filter((c) => c.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  if (categories.length === 0) return null

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-8 sm:mb-12">
          <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-4">Browse by Category</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-foreground text-balance">
            Find markets by topic
          </h2>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/markets/category/${slugify(c.name)}`}
              className="group inline-flex items-center gap-3 border border-border px-4 py-2.5 hover:border-foreground hover:bg-secondary/30 transition-colors"
            >
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{c.count}</span>
              {c.critical > 0 && (
                <span
                  className="text-xs tabular-nums px-1.5 py-0.5"
                  style={{ color: 'var(--risk-critical)', backgroundColor: 'color-mix(in srgb, var(--risk-critical) 12%, transparent)' }}
                  title={`${c.critical} critical-risk markets`}
                >
                  {c.critical} critical
                </span>
              )}
              <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
