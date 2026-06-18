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
      label: 'Markets Scanned',
      value: markets.length.toLocaleString(),
      sub: `across ${eventCount} events`,
      accent: 'var(--risk-low)',
    },
    {
      label: 'Average Clarity Score',
      value: `${avgScore}`,
      valueUnit: '/ 100',
      sub: avgScore >= 70 ? 'Generally adequate' : avgScore >= 50 ? 'Moderate concern' : 'Elevated concern',
      accent:
        avgScore >= 70
          ? 'var(--risk-low)'
          : avgScore >= 50
          ? 'var(--risk-medium)'
          : 'var(--risk-high)',
    },
    {
      label: 'Critical-Risk Markets',
      value: criticalCount.toLocaleString(),
      sub: 'Score below 40',
      accent: criticalCount > 0 ? 'var(--risk-critical)' : 'var(--border)',
    },
    {
      label: 'High-Volume, Low-Clarity',
      value: highVolumeLowClarity.toLocaleString(),
      sub: '>$50K volume, score <60',
      accent: highVolumeLowClarity > 0 ? 'var(--risk-high)' : 'var(--border)',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border border border-border">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-3 sm:gap-4 relative"
        >
          {/* Top accent rule */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ backgroundColor: stat.accent }}
            aria-hidden="true"
          />
          <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground leading-tight">
            {stat.label}
          </p>
          <div>
            <p className="font-heading text-3xl sm:text-4xl font-light tabular-nums text-foreground leading-none">
              {stat.value}
              {stat.valueUnit && (
                <span className="text-xl text-muted-foreground font-light ml-1">{stat.valueUnit}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
