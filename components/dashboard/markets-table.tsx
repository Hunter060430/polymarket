'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/risk-badge'
import { ScoreGauge } from '@/components/score-gauge'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { formatVolume, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'

interface MarketsTableProps {
  markets: NormalizedMarket[]
}

export function MarketsTable({ markets }: MarketsTableProps) {
  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-border">
        <AlertTriangle className="size-6 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No markets available.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-16 text-center text-xs uppercase tracking-wide">Score</TableHead>
            <TableHead className="min-w-[280px] text-xs uppercase tracking-wide">Market Question</TableHead>
            <TableHead className="min-w-[90px] text-xs uppercase tracking-wide">Volume</TableHead>
            <TableHead className="min-w-[100px] text-xs uppercase tracking-wide">End Date</TableHead>
            <TableHead className="min-w-[90px] text-xs uppercase tracking-wide">Risk</TableHead>
            <TableHead className="min-w-[180px] text-xs uppercase tracking-wide">Top Flag</TableHead>
            <TableHead className="w-10 sr-only">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => (
            <TableRow
              key={market.marketId}
              className={cn(
                'hover:bg-secondary/40 transition-colors border-b border-border',
                market.score.riskLevel === 'Critical' && 'border-l-2 border-l-[var(--risk-critical)]',
                market.score.riskLevel === 'High' && 'border-l-2 border-l-[var(--risk-high)]'
              )}
            >
              {/* Score — leftmost, most prominent */}
              <TableCell className="text-center py-3">
                <ScoreGauge score={market.score.totalScore} riskLevel={market.score.riskLevel} size="sm" />
              </TableCell>

              {/* Question */}
              <TableCell className="py-3">
                <Link
                  href={`/markets/${market.marketId}`}
                  className="text-sm font-medium text-foreground hover:text-primary hover:underline leading-snug line-clamp-2 transition-colors"
                >
                  {market.question}
                </Link>
                {market.eventCategory && (
                  <Badge variant="secondary" className="mt-1 text-[10px] font-normal">
                    {market.eventCategory}
                  </Badge>
                )}
              </TableCell>

              <TableCell className="text-sm tabular-nums text-muted-foreground py-3">
                {formatVolume(market.volume)}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground py-3">
                {formatDate(market.endDate) ?? '—'}
              </TableCell>

              <TableCell className="py-3">
                <RiskBadge level={market.score.riskLevel} />
              </TableCell>

              <TableCell className="max-w-[180px] py-3">
                {market.score.flags.length > 0 ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {market.score.flags[0]}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell className="py-3">
                <Link
                  href={`/markets/${market.marketId}`}
                  aria-label={`View details for ${market.question}`}
                  className="inline-flex items-center justify-center size-7 hover:bg-secondary transition-colors"
                >
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
