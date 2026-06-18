'use client'

import { useMemo } from 'react'
import type { NormalizedMarket, RiskLevel } from '@/lib/types'

const RISK_META: { level: RiskLevel; varName: string }[] = [
  { level: 'Low',      varName: 'var(--risk-low)' },
  { level: 'Medium',   varName: 'var(--risk-medium)' },
  { level: 'High',     varName: 'var(--risk-high)' },
  { level: 'Critical', varName: 'var(--risk-critical)' },
]

export function ResolutionStats({ markets }: { markets: NormalizedMarket[] }) {
  const stats = useMemo(() => {
    const total = markets.length || 1
    const byRisk: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 }
    let scoreSum = 0
    let disputeCount = 0

    for (const m of markets) {
      byRisk[m.score.riskLevel]++
      scoreSum += m.score.totalScore
      if (m.oracle.hasDisputeSignal) disputeCount++
    }

    return {
      total: markets.length,
      avgScore: Math.round(scoreSum / total),
      byRisk,
      disputeCount,
      disputeRate: Math.round((disputeCount / total) * 100),
      criticalRate: Math.round((byRisk.Critical / total) * 100),
    }
  }, [markets])

  if (markets.length === 0) return null

  return (
    <div className="border border-border">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <p className="text-xs tracking-[0.1em] uppercase text-foreground">Resolution Quality Record</p>
        <p className="text-xs text-muted-foreground tabular-nums">{stats.total} markets analysed</p>
      </div>

      {/* Top-line metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-b border-border">
        <div className="px-5 py-4">
          <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Avg. Score</p>
          <p className="font-heading text-2xl font-light tabular-nums">{stats.avgScore}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Critical Share</p>
          <p className="font-heading text-2xl font-light tabular-nums" style={{ color: 'var(--risk-critical)' }}>
            {stats.criticalRate}%
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Dispute Signals</p>
          <p className="font-heading text-2xl font-light tabular-nums">{stats.disputeCount}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Dispute Rate</p>
          <p className="font-heading text-2xl font-light tabular-nums">{stats.disputeRate}%</p>
        </div>
      </div>

      {/* Risk distribution bar */}
      <div className="px-5 py-4">
        <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground mb-3">Risk Distribution</p>
        <div className="flex h-3 w-full overflow-hidden rounded-sm">
          {RISK_META.map(({ level, varName }) => {
            const count = stats.byRisk[level]
            const pct = (count / (stats.total || 1)) * 100
            if (pct === 0) return null
            return (
              <div
                key={level}
                style={{ width: `${pct}%`, backgroundColor: varName }}
                title={`${level}: ${count} (${Math.round(pct)}%)`}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
          {RISK_META.map(({ level, varName }) => (
            <div key={level} className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: varName }} aria-hidden="true" />
              <span className="text-xs text-muted-foreground">
                {level} <span className="tabular-nums text-foreground">{stats.byRisk[level]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
