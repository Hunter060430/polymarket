import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, ShieldOff, TrendingDown, Database } from 'lucide-react'
import type { NormalizedMarket } from '@/lib/types'

interface StatsCardsProps {
  markets: NormalizedMarket[]
  eventCount: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
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
      sub: `from ${eventCount} events`,
      icon: Database,
    },
    {
      title: 'Average Clarity Score',
      value: `${avgScore}/100`,
      sub: avgScore >= 70 ? 'Generally adequate' : avgScore >= 50 ? 'Moderate concern' : 'Elevated concern',
      icon: BarChart2,
    },
    {
      title: 'Critical-Risk Markets',
      value: criticalCount.toLocaleString(),
      sub: 'Score below 40',
      icon: ShieldOff,
    },
    {
      title: 'High-Volume, Low-Clarity',
      value: highVolumeLowClarity.toLocaleString(),
      sub: 'Score < 60, Volume > $50K',
      icon: TrendingDown,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
