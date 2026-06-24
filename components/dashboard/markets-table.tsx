'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { RiskBadge } from '@/components/risk-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight } from 'lucide-react'
import { formatVolume, formatDate, cn } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'

interface MarketsTableProps {
  markets: NormalizedMarket[]
}

export function MarketsTable({ markets }: MarketsTableProps) {
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of markets) {
      const c = m.eventCategory?.trim()
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
  }, [markets])

  const visible = useMemo(
    () => (category === 'all' ? markets : markets.filter((m) => m.eventCategory === category)),
    [markets, category],
  )

  if (markets.length === 0) {
    return (
      <div className="border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">No markets available.</p>
      </div>
    )
  }

  return (
    <>
      {/* Category filter toolbar */}
      {categories.length > 0 && (
        <div className="border border-border border-b-0 bg-secondary/20 px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Category</span>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="w-40 text-xs h-8 bg-background border-border" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground tabular-nums ml-auto">
            {visible.length} {visible.length === 1 ? 'market' : 'markets'}
          </span>
        </div>
      )}

    <div className="border border-border overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th scope="col" className="text-left text-xs tracking-[0.1em] uppercase text-muted-foreground font-normal px-4 py-3 w-16">
              Score
            </th>
            <th scope="col" className="text-left text-xs tracking-[0.1em] uppercase text-muted-foreground font-normal px-4 py-3">
              Market Question
            </th>
            <th scope="col" className="text-left text-xs tracking-[0.1em] uppercase text-muted-foreground font-normal px-4 py-3 w-20 hidden md:table-cell">
              Risk
            </th>
            <th scope="col" className="text-right text-xs tracking-[0.1em] uppercase text-muted-foreground font-normal px-4 py-3 w-20 hidden sm:table-cell">
              Volume
            </th>
            <th scope="col" className="text-right text-xs tracking-[0.1em] uppercase text-muted-foreground font-normal px-4 py-3 w-28 hidden lg:table-cell">
              End Date
            </th>
            <th scope="col" className="w-10 px-4 py-3">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visible.map((market) => {
            const isCritical = market.score.riskLevel === 'Critical'
            const isHigh     = market.score.riskLevel === 'High'
            return (
              <tr
                key={market.marketId}
                className={cn(
                  'group hover:bg-secondary/30 transition-colors',
                  isCritical && '[border-left:2px_solid_var(--risk-critical)]',
                  isHigh     && '[border-left:2px_solid_var(--risk-high)]'
                )}
              >
                {/* Score */}
                <td className="px-4 py-4 text-center">
                  <span
                    className="font-heading text-2xl font-light tabular-nums leading-none"
                    style={{
                      color:
                        market.score.riskLevel === 'Low'      ? 'var(--risk-low)' :
                        market.score.riskLevel === 'Medium'   ? 'var(--risk-medium)' :
                        market.score.riskLevel === 'High'     ? 'var(--risk-high)' :
                        'var(--risk-critical)',
                    }}
                  >
                    {market.score.totalScore}
                  </span>
                </td>

                {/* Question */}
                <td className="px-4 py-4 max-w-sm">
                  <Link
                    href={`/markets/${market.marketId}`}
                    className="text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {market.question}
                  </Link>
                  {market.score.flags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {market.score.flags[0]}
                    </p>
                  )}
                </td>

                {/* Risk */}
                <td className="px-4 py-4 hidden md:table-cell">
                  <RiskBadge level={market.score.riskLevel} />
                </td>

                {/* Volume */}
                <td className="px-4 py-4 text-right tabular-nums text-sm text-muted-foreground hidden sm:table-cell">
                  {formatVolume(market.volume)}
                </td>

                {/* End date */}
                <td className="px-4 py-4 text-right text-xs text-muted-foreground hidden lg:table-cell">
                  {formatDate(market.endDate) ?? '—'}
                </td>

                {/* Arrow */}
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/markets/${market.marketId}`}
                    aria-label={`View ${market.question}`}
                    className="inline-flex items-center justify-center size-7 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}
