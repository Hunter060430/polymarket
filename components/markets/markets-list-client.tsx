'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RiskBadge } from '@/components/risk-badge'
import { Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatVolume, formatDate, cn } from '@/lib/utils'
import type { NormalizedMarket, RiskLevel } from '@/lib/types'

const PAGE_SIZE = 25
const RISK_ORDER: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

interface MarketsListClientProps {
  markets: NormalizedMarket[]
}

export function MarketsListClient({ markets }: MarketsListClientProps) {
  const [query, setQuery]           = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [minVolume, setMinVolume]   = useState<string>('0')
  const [sortBy, setSortBy]         = useState<string>('score-asc')
  const [page, setPage]             = useState(1)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1) }
  }

  const filtered = useMemo(() => {
    const result = markets.filter((m) => {
      if (query) {
        const q = query.toLowerCase()
        if (!m.question.toLowerCase().includes(q) && !m.eventTitle.toLowerCase().includes(q) && !m.eventCategory.toLowerCase().includes(q))
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
        default:     return 0
      }
    })
  }, [markets, query, riskFilter, minVolume, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-0">

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="border border-border border-b-0 bg-secondary/20 px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search markets..."
            className="pl-9 text-xs h-8 bg-background border-border"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            aria-label="Search markets"
          />
        </div>

        <Select value={riskFilter} onValueChange={(v) => v && resetPage(setRiskFilter)(v)}>
          <SelectTrigger className="w-36 text-xs h-8 bg-background border-border" aria-label="Risk level filter">
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

        <Select value={minVolume} onValueChange={(v) => v && resetPage(setMinVolume)(v)}>
          <SelectTrigger className="w-32 text-xs h-8 bg-background border-border" aria-label="Minimum volume">
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

        <Select value={sortBy} onValueChange={(v) => v && resetPage(setSortBy)(v)}>
          <SelectTrigger className="w-44 text-xs h-8 bg-background border-border" aria-label="Sort by">
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

      {/* ── Count bar ──────────────────────────────────────── */}
      <div className="border border-border border-b-0 px-4 py-2 flex items-center justify-between bg-background">
        <p className="text-xs text-muted-foreground">
          {filtered.length === 0
            ? 'No markets match.'
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} markets`}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-muted-foreground">Page {safePage} / {totalPages}</p>
        )}
      </div>

      {/* ── Market rows ────────────────────────────────────── */}
      <div className="border border-border divide-y divide-border">
        {pageItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No markets match the current filters.</p>
          </div>
        ) : (
          pageItems.map((market) => {
            const isCritical = market.score.riskLevel === 'Critical'
            const isHigh     = market.score.riskLevel === 'High'
            return (
              <div
                key={market.marketId}
                className={cn(
                  'flex items-center gap-5 px-5 py-4 hover:bg-secondary/25 transition-colors',
                  isCritical && '[border-left:2px_solid_var(--risk-critical)]',
                  isHigh     && '[border-left:2px_solid_var(--risk-high)]'
                )}
              >
                {/* Score number */}
                <div className="shrink-0 w-10 text-center">
                  <span
                    className="font-heading text-3xl font-light tabular-nums leading-none"
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
                </div>

                {/* Thin divider */}
                <div className="w-px self-stretch bg-border shrink-0" aria-hidden="true" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/markets/${market.marketId}`}
                    className="text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug font-medium"
                  >
                    {market.question}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <RiskBadge level={market.score.riskLevel} />
                    {market.eventCategory && (
                      <span className="text-xs text-muted-foreground">{market.eventCategory}</span>
                    )}
                    {market.score.flags.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs hidden sm:inline">
                        &middot; {market.score.flags[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span className="tabular-nums font-medium">{formatVolume(market.volume)}</span>
                  {market.endDate && <span>{formatDate(market.endDate)}</span>}
                </div>

                {/* Arrow */}
                <Link
                  href={`/markets/${market.marketId}`}
                  aria-label={`View ${market.question}`}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="border border-border border-t-0 px-4 py-3 flex items-center justify-center gap-1" role="navigation" aria-label="Pagination">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} aria-label="Previous page" className="text-xs h-8 px-3">
            <ChevronLeft className="size-3.5 mr-1" aria-hidden="true" />Prev
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
                <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
              ) : (
                <Button
                  key={item}
                  variant={item === safePage ? 'default' : 'ghost'}
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

          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} aria-label="Next page" className="text-xs h-8 px-3">
            Next<ChevronRight className="size-3.5 ml-1" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
