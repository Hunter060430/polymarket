import { BarChart2, ShieldOff, TrendingDown, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'

interface StatsCardsProps {
  markets: NormalizedMarket[]
  eventCount: number
}

export function StatsCards({ markets, eventCount }: StatsCardsProps) {
  const avgScore =
    markets.length > 0
      ? Math.round(markets.reduce((sum, m) => sum + m.score.totalScore, 0) / markets.length)
      : 0

  const criticalCount = markets.filter((m) => m.score.riskLevel === 'Critical').length

  const highVolumeLowClarity = markets.filter(
    (m) => m.volume > 50_000 && m.score.totalScore < 60
  ).length

  const stats = [
    {
      title: 'Markets Scanned',
      value: markets.length.toLocaleString(),
      sub: `across ${eventCount} events`,
      icon: Database,
      accent: 'border-l-2 border-l-[var(--risk-low)]',
      valueClass: 'text-foreground',
    },
    {
      title: 'Average Clarity Score',
      value: `${avgScore}/100`,
      sub:
        avgScore >= 70
          ? 'Generally adequate'
          : avgScore >= 50
          ? 'Moderate concern'
          : 'Elevated concern',
      icon: BarChart2,
      accent:
        avgScore >= 70
          ? 'border-l-2 border-l-[var(--risk-low)]'
          : avgScore >= 50
          ? 'border-l-2 border-l-[var(--risk-medium)]'
          : 'border-l-2 border-l-[var(--risk-high)]',
      valueClass:
        avgScore >= 70
          ? 'text-[var(--risk-low)]'
          : avgScore >= 50
          ? 'text-[var(--risk-medium)]'
          : 'text-[var(--risk-high)]',
    },
    {
      title: 'Critical-Risk Markets',
      value: criticalCount.toLocaleString(),
      sub: 'Score below 40',
      icon: ShieldOff,
      accent:
        criticalCount > 0
          ? 'border-l-2 border-l-[var(--risk-critical)]'
          : 'border-l-2 border-l-border',
      valueClass: criticalCount > 0 ? 'text-[var(--risk-critical)]' : 'text-foreground',
    },
    {
      title: 'High-Volume, Low-Clarity',
      value: highVolumeLowClarity.toLocaleString(),
      sub: 'Volume >$50K, Score <60',
      icon: TrendingDown,
      accent:
        highVolumeLowClarity > 0
          ? 'border-l-2 border-l-[var(--risk-high)]'
          : 'border-l-2 border-l-border',
      valueClass: highVolumeLowClarity > 0 ? 'text-[var(--risk-high)]' : 'text-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className={cn(
              'bg-card border border-border px-4 py-4 flex flex-col gap-3',
              stat.accent
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground leading-tight">{stat.title}</p>
              <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className={cn('font-heading text-2xl font-light tabular-nums', stat.valueClass)}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
