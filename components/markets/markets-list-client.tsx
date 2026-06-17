'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/risk-badge'
import { ScoreGauge } from '@/components/score-gauge'
import { Search, ArrowRight, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatVolume, formatDate, cn } from '@/lib/utils'
import type { NormalizedMarket, RiskLevel } from '@/lib/types'

interface MarketsListClientProps {
  markets: NormalizedMarket[]
}

const PAGE_SIZE = 25
const RISK_ORDER: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export function MarketsListClient({ markets }: MarketsListClientProps) {
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [minVolume, setMinVolume] = useState<string>('0')
  const [sortBy, setSortBy] = useState<string>('score-asc')
  const [page, setPage] = useState(1)

  function updateFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  const filtered = useMemo(() => {
    const result = markets.filter((m) => {
      if (query) {
        const q = query.toLowerCase()
        if (
          !m.question.toLowerCase().includes(q) &&
          !m.eventTitle.toLowerCase().includes(q) &&
          !m.eventCategory.toLowerCase().includes(q)
        )
          return false
      }
      if (riskFilter !== 'all' && m.score.riskLevel !== riskFilter) return false
      if (m.volume < (parseFloat(minVolume) || 0)) return false
      return true
    })

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'score-asc':   return a.score.totalScore - b.score.totalScore
        case 'score-desc':  return b.score.totalScore - a.score.totalScore
        case 'volume-desc': return b.volume - a.volume
        case 'volume-asc':  return a.volume - b.volume
        case 'enddate-asc': {
          const da = a.endDate ? new Date(a.endDate).getTime() : Infinity
          const db = b.endDate ? new Date(b.endDate).getTime() : Infinity
          return da - db
        }
        case 'risk': return RISK_ORDER[a.score.riskLevel] - RISK_ORDER[b.score.riskLevel]
        default: return 0
      }
    })
  }, [markets, query, riskFilter, minVolume, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search markets, events, categories..."
            className="pl-9 text-sm"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            aria-label="Search markets"
          />
        </div>

        <Select value={riskFilter} onValueChange={(v) => v && updateFilter(setRiskFilter)(v)}>
          <SelectTrigger className="w-[148px] text-sm" aria-label="Filter by risk level">
            <SelectValue placeholder="Risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minVolume} onValueChange={(v) => v && updateFilter(setMinVolume)(v)}>
          <SelectTrigger className="w-[148px] text-sm" aria-label="Minimum volume filter">
            <SelectValue placeholder="Min volume" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any volume</SelectItem>
            <SelectItem value="10000">$10K+</SelectItem>
            <SelectItem value="50000">$50K+</SelectItem>
            <SelectItem value="100000">$100K+</SelectItem>
            <SelectItem value="500000">$500K+</SelectItem>
            <SelectItem value="1000000">$1M+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => v && updateFilter(setSortBy)(v)}>
          <SelectTrigger className="w-[170px] text-sm" aria-label="Sort markets by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score-asc">Score: Lowest first</SelectItem>
            <SelectItem value="score-desc">Score: Highest first</SelectItem>
            <SelectItem value="volume-desc">Volume: Highest first</SelectItem>
            <SelectItem value="volume-asc">Volume: Lowest first</SelectItem>
            <SelectItem value="enddate-asc">End date: Soonest</SelectItem>
            <SelectItem value="risk">Risk: Critical first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length === 0
            ? 'No markets match the current filters.'
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} markets`}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-muted-foreground">
            Page {safePage} / {totalPages}
          </p>
        )}
      </div>

      {/* Empty state */}
      {pageItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border">
          <AlertTriangle className="size-6 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No markets match the current filters.</p>
        </div>
      )}

      {/* Market rows — score left, content right */}
      <div className="flex flex-col border border-border divide-y divide-border">
        {pageItems.map((market) => (
          <div
            key={market.marketId}
            className={cn(
              'flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition-colors',
              market.score.riskLevel === 'Critical' && 'border-l-2 border-l-[var(--risk-critical)]',
              market.score.riskLevel === 'High' && 'border-l-2 border-l-[var(--risk-high)]'
            )}
          >
            {/* Score badge — leftmost */}
            <div className="shrink-0">
              <ScoreGauge score={market.score.totalScore} riskLevel={market.score.riskLevel} size="sm" />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/markets/${market.marketId}`}
                className="text-sm font-medium text-foreground hover:text-primary hover:underline leading-snug line-clamp-2 transition-colors"
              >
                {market.question}
              </Link>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {market.eventCategory && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {market.eventCategory}
                  </Badge>
                )}
                <RiskBadge level={market.score.riskLevel} />
                {market.score.flags.length > 0 && (
                  <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                    {market.score.flags[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Meta + link */}
            <div className="shrink-0 flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
              <span className="tabular-nums">{formatVolume(market.volume)}</span>
              {market.endDate && (
                <span>{formatDate(market.endDate)}</span>
              )}
              <Link
                href={`/markets/${market.marketId}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
                aria-label={`View details for ${market.question}`}
              >
                Detail <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-2 pt-2"
          role="navigation"
          aria-label="Pagination"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
              acc.push(p)
              return acc
            }, [])
            .map((item, idx) =>
              item === '…' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs text-muted-foreground select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === safePage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(item as number)}
                  aria-label={`Page ${item}`}
                  aria-current={item === safePage ? 'page' : undefined}
                  className="size-8 p-0 text-xs"
                >
                  {item}
                </Button>
              )
            )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
