'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Search, X, Plus, ExternalLink, Loader2 } from 'lucide-react'
import { RiskBadge } from '@/components/risk-badge'
import { DIMENSION_LABELS } from '@/lib/rule-clarity-score'
import { formatVolume, polymarketUrl, formatPriceChange } from '@/lib/utils'
import type { NormalizedMarket, RuleClarityBreakdown } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const MAX_COMPARE = 4

const DIM_ORDER: (keyof RuleClarityBreakdown)[] = [
  'timeClarity', 'resolutionSource', 'outcomeDefinition',
  'evidenceStandard', 'edgeCaseHandling', 'postHocRisk',
]

function riskColor(level: string): string {
  return level === 'Low' ? 'var(--risk-low)'
    : level === 'Medium' ? 'var(--risk-medium)'
    : level === 'High' ? 'var(--risk-high)'
    : 'var(--risk-critical)'
}

export function CompareClient() {
  const { data, isLoading, error } = useSWR<{ markets: NormalizedMarket[] }>(
    '/api/markets?limit=500',
    fetcher,
    { revalidateOnFocus: false },
  )
  const markets: NormalizedMarket[] = data?.markets ?? []

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => selectedIds.map((id) => markets.find((m) => m.marketId === id)).filter(Boolean) as NormalizedMarket[],
    [selectedIds, markets],
  )

  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return []
    const lower = query.toLowerCase()
    return markets
      .filter((m) => m.question.toLowerCase().includes(lower) && !selectedIds.includes(m.marketId))
      .slice(0, 6)
  }, [query, markets, selectedIds])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading markets…
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive border-l-2 border-destructive pl-3 py-1">
        Failed to load markets. Please refresh and try again.
      </p>
    )
  }

  const add = (id: string) => {
    if (selectedIds.length >= MAX_COMPARE || selectedIds.includes(id)) return
    setSelectedIds((ids) => [...ids, id])
    setQuery('')
  }
  const remove = (id: string) => setSelectedIds((ids) => ids.filter((x) => x !== id))

  return (
    <div className="flex flex-col gap-8">
      {/* Search / add bar */}
      <div className="relative">
        <div className="flex items-center gap-2 border border-border px-3 h-11">
          <Search className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selectedIds.length >= MAX_COMPARE
                ? `Maximum of ${MAX_COMPARE} markets reached`
                : 'Search markets to add to comparison…'
            }
            disabled={selectedIds.length >= MAX_COMPARE}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            aria-label="Search markets to compare"
          />
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {selectedIds.length}/{MAX_COMPARE}
          </span>
        </div>

        {searchResults.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 border border-border bg-popover shadow-lg max-h-80 overflow-auto">
            {searchResults.map((m) => (
              <li key={m.marketId}>
                <button
                  type="button"
                  onClick={() => add(m.marketId)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors border-b border-border last:border-b-0"
                >
                  <Plus className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-sm text-foreground line-clamp-1 flex-1">{m.question}</span>
                  <span
                    className="text-xs tabular-nums shrink-0 font-medium"
                    style={{ color: riskColor(m.score.riskLevel) }}
                  >
                    {m.score.totalScore}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Empty state */}
      {selected.length === 0 && (
        <div className="border border-dashed border-border py-16 flex flex-col items-center justify-center gap-2 text-center">
          <p className="font-heading text-xl font-light text-foreground">No markets selected</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Search above to add markets. Compare clarity scores, dimension-by-dimension
            breakdowns, prices, and volume side by side.
          </p>
        </div>
      )}

      {/* Comparison table */}
      {selected.length > 0 && (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left align-top p-0 w-36 sm:w-44">
                  <span className="sr-only">Metric</span>
                </th>
                {selected.map((m) => (
                  <th key={m.marketId} className="text-left align-top p-3 border-l border-border min-w-[180px]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <RiskBadge level={m.score.riskLevel} />
                      <button
                        type="button"
                        onClick={() => remove(m.marketId)}
                        aria-label={`Remove ${m.question}`}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <Link
                      href={`/markets/${m.marketId}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-3 leading-snug"
                    >
                      {m.question}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Total score */}
              <tr className="border-t border-border">
                <td className="py-3 pr-3 text-xs tracking-[0.08em] uppercase text-muted-foreground align-middle">
                  Clarity Score
                </td>
                {selected.map((m) => (
                  <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle">
                    <span
                      className="font-heading text-3xl font-light tabular-nums"
                      style={{ color: riskColor(m.score.riskLevel) }}
                    >
                      {m.score.totalScore}
                    </span>
                    <span className="text-xs text-muted-foreground"> /100</span>
                  </td>
                ))}
              </tr>

              {/* Dimension rows */}
              {DIM_ORDER.map((dim) => {
                const meta = DIMENSION_LABELS[dim]
                return (
                  <tr key={dim} className="border-t border-border">
                    <td className="py-3 pr-3 text-xs text-muted-foreground align-middle">
                      {meta.label}
                      <span className="block text-[10px] opacity-60">max {meta.max}</span>
                    </td>
                    {selected.map((m) => {
                      const val = m.score.breakdown[dim]
                      const pct = (val / meta.max) * 100
                      return (
                        <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle">
                          <div className="flex items-center gap-2">
                            <span className="text-sm tabular-nums w-10 shrink-0">{val}/{meta.max}</span>
                            <div className="flex-1 h-1.5 bg-secondary min-w-[40px]">
                              <div
                                className="h-full"
                                style={{ width: `${pct}%`, backgroundColor: riskColor(m.score.riskLevel) }}
                              />
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Current YES price */}
              <tr className="border-t border-border">
                <td className="py-3 pr-3 text-xs text-muted-foreground align-middle">Current Price (YES)</td>
                {selected.map((m) => (
                  <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle text-sm tabular-nums">
                    {m.outcomePrices[0] !== undefined ? `${(m.outcomePrices[0] * 100).toFixed(1)}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* 24h change */}
              <tr className="border-t border-border">
                <td className="py-3 pr-3 text-xs text-muted-foreground align-middle">24h Change</td>
                {selected.map((m) => {
                  const pc = formatPriceChange(m.oneDayPriceChange)
                  return (
                    <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle text-sm tabular-nums">
                      {pc ? (
                        <span style={{ color: m.oneDayPriceChange >= 0 ? 'var(--risk-low)' : 'var(--risk-critical)' }}>
                          {pc}
                        </span>
                      ) : '—'}
                    </td>
                  )
                })}
              </tr>

              {/* Volume */}
              <tr className="border-t border-border">
                <td className="py-3 pr-3 text-xs text-muted-foreground align-middle">Volume</td>
                {selected.map((m) => (
                  <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle text-sm tabular-nums">
                    {formatVolume(m.volume)}
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr className="border-t border-border">
                <td className="py-3 pr-3 text-xs text-muted-foreground align-middle">Category</td>
                {selected.map((m) => (
                  <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle text-sm">
                    {m.eventCategory || '—'}
                  </td>
                ))}
              </tr>

              {/* Trade link */}
              <tr className="border-t border-border">
                <td className="py-3 pr-3 text-xs text-muted-foreground align-middle">Trade</td>
                {selected.map((m) => (
                  <td key={m.marketId} className="py-3 px-3 border-l border-border align-middle">
                    {m.marketSlug ? (
                      <a
                        href={polymarketUrl(m.marketSlug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
                      >
                        Polymarket <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ) : '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
