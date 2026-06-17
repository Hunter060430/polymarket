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
import { ScoreBar } from '@/components/score-gauge'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import type { NormalizedMarket } from '@/lib/types'

interface MarketsTableProps {
  markets: NormalizedMarket[]
}

function formatVolume(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function MarketsTable({ markets }: MarketsTableProps) {
  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No markets available.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[280px]">Market Question</TableHead>
            <TableHead className="min-w-[140px]">Event</TableHead>
            <TableHead className="min-w-[90px]">Volume</TableHead>
            <TableHead className="min-w-[90px]">Liquidity</TableHead>
            <TableHead className="min-w-[110px]">End Date</TableHead>
            <TableHead className="min-w-[110px]">Clarity Score</TableHead>
            <TableHead className="min-w-[90px]">Risk Level</TableHead>
            <TableHead className="min-w-[200px]">Top Flags</TableHead>
            <TableHead className="w-12 sr-only">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => (
            <TableRow key={market.marketId} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium text-sm max-w-xs">
                <span className="line-clamp-2 leading-relaxed">{market.question}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[140px]">
                <span className="line-clamp-1">{market.eventTitle || '—'}</span>
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {formatVolume(market.volume)}
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {formatVolume(market.liquidity)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(market.endDate)}
              </TableCell>
              <TableCell>
                <ScoreBar score={market.score.totalScore} riskLevel={market.score.riskLevel} />
              </TableCell>
              <TableCell>
                <RiskBadge level={market.score.riskLevel} />
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="flex flex-wrap gap-1">
                  {market.score.flags.slice(0, 2).map((flag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs font-normal line-clamp-1 max-w-[190px] truncate"
                      title={flag}
                    >
                      {flag}
                    </Badge>
                  ))}
                  {market.score.flags.length === 0 && (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/markets/${market.marketId}`}
                  aria-label={`View details for ${market.question}`}
                  className="inline-flex items-center justify-center rounded-md px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
