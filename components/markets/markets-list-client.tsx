'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/risk-badge'
import { ScoreBar } from '@/components/score-gauge'
import { Search, ArrowUpRight, AlertTriangle } from 'lucide-react'
import type { NormalizedMarket, RiskLevel } from '@/lib/types'

interface MarketsListClientProps {
  markets: NormalizedMarket[]
}

const RISK_ORDER: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

function formatVolume(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

export function MarketsListClient({ markets }: MarketsListClientProps) {
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [minVolume, setMinVolume] = useState<string>('0')
  const [sortBy, setSortBy] = useState<string>('score-asc')

  const filtered = useMemo(() => {
    let result = markets.filter((m) => {
      if (query) {
        const q = query.toLowerCase()
        if (
          !m.question.toLowerCase().includes(q) &&
          !m.eventTitle.toLowerCase().includes(q) &&
          !m.eventCategory.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (riskFilter !== 'all' && m.score.riskLevel !== riskFilter) return false
      const mv = parseFloat(minVolume) || 0
      if (m.volume < mv) return false
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'score-asc':
          return a.score.totalScore - b.score.totalScore
        case 'score-desc':
          return b.score.totalScore - a.score.totalScore
        case 'volume-desc':
          return b.volume - a.volume
        case 'volume-asc':
          return a.volume - b.volume
        case 'enddate-asc': {
          const da = a.endDate ? new Date(a.endDate).getTime() : Infinity
          const db = b.endDate ? new Date(b.endDate).getTime() : Infinity
          return da - db
        }
        case 'risk': {
          return RISK_ORDER[a.score.riskLevel] - RISK_ORDER[b.score.riskLevel]
        }
        default:
          return 0
      }
    })

    return result
  }, [markets, query, riskFilter, minVolume, sortBy])

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search markets, events, categories..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search markets"
          />
        </div>

        <Select value={riskFilter} onValueChange={(v) => v && setRiskFilter(v)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by risk level">
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

        <Select value={minVolume} onValueChange={(v) => v && setMinVolume(v)}>
          <SelectTrigger className="w-[160px]" aria-label="Minimum volume filter">
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

        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger className="w-[180px]" aria-label="Sort markets by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score-asc">Score: Lowest first</SelectItem>
            <SelectItem value="score-desc">Score: Highest first</SelectItem>
            <SelectItem value="volume-desc">Volume: Highest first</SelectItem>
            <SelectItem value="volume-asc">Volume: Lowest first</SelectItem>
            <SelectItem value="enddate-asc">End date: Soonest first</SelectItem>
            <SelectItem value="risk">Risk: Critical first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {markets.length} markets
      </p>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No markets match the current filters.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((market) => (
          <Card key={market.marketId} className="hover:bg-muted/30 transition-colors">
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/markets/${market.marketId}`}
                    className="text-sm font-medium text-foreground hover:underline leading-snug line-clamp-2"
                  >
                    {market.question}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {market.eventCategory && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {market.eventCategory}
                      </Badge>
                    )}
                    {market.eventTitle && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {market.eventTitle}
                      </span>
                    )}
                  </div>
                  {market.score.flags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                      {market.score.flags[0]}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <RiskBadge level={market.score.riskLevel} />
                  <ScoreBar score={market.score.totalScore} riskLevel={market.score.riskLevel} />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span title="Volume">{formatVolume(market.volume)}</span>
                    {market.endDate && (
                      <span title="End date">{formatDate(market.endDate)}</span>
                    )}
                    <Link
                      href={`/markets/${market.marketId}`}
                      className="text-primary hover:underline flex items-center gap-0.5"
                      aria-label={`View details for ${market.question}`}
                    >
                      Detail <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
