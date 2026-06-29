'use client'

import { useMemo, useCallback, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RiskBadge } from '@/components/risk-badge'
import { StarButton } from '@/components/markets/star-button'
import { Search, ArrowRight, ChevronLeft, ChevronRight, Keyboard } from 'lucide-react'
import { formatVolume, formatDate, cn } from '@/lib/utils'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useWatchlist } from '@/hooks/use-watchlist'
import type { NormalizedMarket, RiskLevel } from '@/lib/types'

const PAGE_SIZE = 25
const RISK_ORDER: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

interface MarketsListClientProps {
  markets: NormalizedMarket[]
}

export function MarketsListClient({ markets }: MarketsListClientProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const searchRef    = useRef<HTMLInputElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const { watchlist } = useWatchlist()

  // Interactive filters — pure client-side state, no URL round-trips on every
  // keystroke. Only the "shareable" params (sort, risk) live in the URL.
  const [query,      setQuery]      = useState('')
  const [riskFilter, setRiskFilter] = useState(() => searchParams.get('risk') ?? 'all')
  const [category,   setCategory]   = useState(() => searchParams.get('category') ?? 'all')
  const [minVolume,  setMinVolume]  = useState(() => searchParams.get('minvol') ?? '0')
  const [sortBy,     setSortBy]     = useState(() => searchParams.get('sort') ?? 'score-asc')
  const [page,       setPageState]  = useState(1)

  // Unique categories present in the data, sorted by market count (desc)
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

  // Sync shareable params to URL without causing a server round-trip
  const syncUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all' || value === '0' || value === 'score-asc') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    params.delete('page')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const handleRiskChange = useCallback((v: string) => {
    setRiskFilter(v)
    setPageState(1)
    syncUrl({ risk: v })
  }, [syncUrl])

  const handleCategoryChange = useCallback((v: string) => {
    setCategory(v)
    setPageState(1)
    syncUrl({ category: v })
  }, [syncUrl])

  const handleMinvolChange = useCallback((v: string) => {
    setMinVolume(v)
    setPageState(1)
    syncUrl({ minvol: v })
  }, [syncUrl])

  const handleSortChange = useCallback((v: string) => {
    setSortBy(v)
    setPageState(1)
    syncUrl({ sort: v })
  }, [syncUrl])

  const clearFilters = useCallback(() => {
    setQuery('')
    setRiskFilter('all')
    setCategory('all')
    setMinVolume('0')
    setSortBy('score-asc')
    setPageState(1)
    setFocusedIndex(-1)
    router.replace('?', { scroll: false })
  }, [router])

  const filtered = useMemo(() => {
    let result = markets

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (m) =>
          m.question.toLowerCase().includes(q) ||
          m.eventTitle.toLowerCase().includes(q) ||
          m.eventCategory.toLowerCase().includes(q),
      )
    }

    if (riskFilter === 'Starred') {
      result = result.filter((m) => watchlist.has(m.marketId))
    } else if (riskFilter !== 'all') {
      result = result.filter((m) => m.score.riskLevel === riskFilter)
    }

    if (category !== 'all') {
      result = result.filter((m) => m.eventCategory === category)
    }

    const minvol = parseFloat(minVolume) || 0
    if (minvol > 0) {
      result = result.filter((m) => m.volume >= minvol)
    }

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
  }, [markets, query, riskFilter, category, minVolume, sortBy, watchlist])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageItemIds = useMemo(() => pageItems.map((m) => m.marketId), [pageItems])

  useKeyboardShortcuts({
    marketIds: pageItemIds,
    activeIndex: focusedIndex,
    onChangeIndex: setFocusedIndex,
    searchInputRef: searchRef,
    onClearFilters: clearFilters,
  })

  return (
    <div className="flex flex-col gap-0">

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="border border-border border-b-0 bg-secondary/20 px-3 sm:px-4 py-3 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchRef}
            placeholder="Search markets... (press / to focus)"
            className="pl-9 text-xs h-8 bg-background border-border w-full"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPageState(1) }}
            aria-label="Search markets"
          />
        </div>

        {/* Selects — 2-column grid on mobile, single row on sm+ */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:flex-wrap">
          <Select value={riskFilter} onValueChange={(v) => v && handleRiskChange(v)}>
            <SelectTrigger className="w-full sm:w-36 text-xs h-8 bg-background border-border" aria-label="Risk level filter">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Starred">Starred</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select value={category} onValueChange={(v) => v && handleCategoryChange(v)}>
              <SelectTrigger className="w-full sm:w-36 text-xs h-8 bg-background border-border" aria-label="Category filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={minVolume} onValueChange={(v) => v && handleMinvolChange(v)}>
            <SelectTrigger className="w-full sm:w-32 text-xs h-8 bg-background border-border" aria-label="Minimum volume">
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

          <Select value={sortBy} onValueChange={(v) => v && handleSortChange(v)}>
            <SelectTrigger className="w-full sm:w-44 text-xs h-8 bg-background border-border" aria-label="Sort by">
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
      </div>

      {/* ── Count bar ──────────────────────────────────────── */}
      <div className="border border-border border-b-0 px-4 py-2 flex items-center justify-between bg-background">
        <p className="text-xs text-muted-foreground">
          {filtered.length === 0
            ? 'No markets match.'
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} markets`}
        </p>
        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <p className="text-xs text-muted-foreground">Page {safePage} / {totalPages}</p>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/60 select-none" aria-hidden="true">
            <Keyboard className="size-3" />
            <kbd className="border border-border px-1">J/K</kbd>
            <span>navigate</span>
            <kbd className="border border-border px-1">↵</kbd>
            <span>open</span>
            <kbd className="border border-border px-1">/</kbd>
            <span>search</span>
            <kbd className="border border-border px-1">Esc</kbd>
            <span>clear</span>
          </div>
        </div>
      </div>

      {/* ── Market rows ────────────────────────────────────── */}
      <div className="border border-border divide-y divide-border">
        {pageItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No markets match the current filters.</p>
          </div>
        ) : (
          pageItems.map((market, rowIdx) => {
            const isCritical = market.score.riskLevel === 'Critical'
            const isHigh     = market.score.riskLevel === 'High'
            const isFocused  = rowIdx === focusedIndex
            return (
              <div
                key={market.marketId}
                onClick={() => setFocusedIndex(rowIdx)}
                className={cn(
                  'flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 sm:py-4 hover:bg-secondary/25 transition-colors cursor-default',
                  isCritical && '[border-left:2px_solid_var(--risk-critical)]',
                  isHigh     && '[border-left:2px_solid_var(--risk-high)]',
                  isFocused  && 'bg-secondary/40 outline outline-1 outline-primary/40',
                )}
              >
                {/* Score */}
                <div className="shrink-0 w-8 sm:w-10 text-center">
                  <span
                    className="font-heading text-2xl sm:text-3xl font-light tabular-nums leading-none"
                    style={{
                      color:
                        market.score.riskLevel === 'Low'    ? 'var(--risk-low)' :
                        market.score.riskLevel === 'Medium' ? 'var(--risk-medium)' :
                        market.score.riskLevel === 'High'   ? 'var(--risk-high)' :
                        'var(--risk-critical)',
                    }}
                  >
                    {market.score.totalScore}
                  </span>
                </div>

                <div className="w-px self-stretch bg-border shrink-0" aria-hidden="true" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/markets/${market.marketId}`}
                    className="text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug font-medium"
                  >
                    {market.question}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <RiskBadge level={market.score.riskLevel} />
                    {market.eventCategory && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">{market.eventCategory}</span>
                    )}
                    {market.score.flags.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs hidden md:inline">
                        &middot; {market.score.flags[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* YES probability */}
                {market.outcomePrices.length > 0 && (
                  <div className="shrink-0 hidden sm:flex flex-col items-end gap-0.5">
                    <span
                      className="font-heading text-base font-light tabular-nums leading-none"
                      style={{
                        color:
                          market.outcomePrices[0] >= 0.7 ? 'var(--risk-low)' :
                          market.outcomePrices[0] >= 0.4 ? 'var(--risk-medium)' :
                          'var(--risk-high)',
                      }}
                    >
                      {(market.outcomePrices[0] * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {market.outcomes[0] ?? 'YES'}
                    </span>
                  </div>
                )}

                {/* Volume / date */}
                <div className="shrink-0 hidden md:flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span className="tabular-nums font-medium">{formatVolume(market.volume)}</span>
                  {market.endDate && <span>{formatDate(market.endDate)}</span>}
                </div>

                {/* Star */}
                <StarButton marketId={market.marketId} />

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
          <Button
            variant="ghost" size="sm"
            onClick={() => setPageState(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="text-xs h-8 px-3"
          >
            <ChevronLeft className="size-3.5 mr-1" aria-hidden="true" />Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">...</span>
              ) : (
                <Button
                  key={item}
                  variant={item === safePage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPageState(item as number)}
                  aria-label={`Page ${item}`}
                  aria-current={item === safePage ? 'page' : undefined}
                  className="size-8 p-0 text-xs"
                >
                  {item}
                </Button>
              ),
            )}

          <Button
            variant="ghost" size="sm"
            onClick={() => setPageState(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className="text-xs h-8 px-3"
          >
            Next<ChevronRight className="size-3.5 ml-1" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
