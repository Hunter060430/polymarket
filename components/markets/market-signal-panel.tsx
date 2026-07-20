import { Gauge, Landmark } from 'lucide-react'
import type { LiquidityScore, RegulatorySensitivityScore, RiskLevel } from '@/lib/types'

function tone(level: RiskLevel) {
  return level === 'Low' ? 'var(--risk-low)'
    : level === 'Medium' ? 'var(--risk-medium)'
      : level === 'High' ? 'var(--risk-high)'
        : 'var(--risk-critical)'
}

function ScoreCard({
  label,
  description,
  score,
  level,
  reasons,
  icon,
}: {
  label: string
  description: string
  score: number
  level: RiskLevel
  reasons: string[]
  icon: React.ReactNode
}) {
  const color = tone(level)
  return (
    <article className="border border-border p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
            {icon}{label}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-heading text-4xl font-light tabular-nums" style={{ color }}>{score}</p>
          <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color }}>{level}</p>
        </div>
      </div>
      <div className="h-1 bg-secondary overflow-hidden" aria-hidden="true">
        <div className="h-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <ul className="flex flex-col gap-2">
        {reasons.map((reason) => (
          <li key={reason} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="mt-1.5 size-1 shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
            {reason}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function MarketSignalPanel({
  regulatory,
  liquidity,
}: {
  regulatory: RegulatorySensitivityScore
  liquidity: LiquidityScore
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ScoreCard
        label="Regulatory sensitivity"
        description="Exposure to political, legal, or government-dependent outcomes. Higher means more external intervention risk."
        score={regulatory.score}
        level={regulatory.level}
        reasons={regulatory.reasons}
        icon={<Landmark className="size-4" aria-hidden="true" />}
      />
      <ScoreCard
        label="Trading liquidity"
        description="Execution quality based on depth, turnover, lifetime volume, and quoted spread. Higher means easier entry and exit."
        score={liquidity.score}
        level={liquidity.level}
        reasons={liquidity.reasons}
        icon={<Gauge className="size-4" aria-hidden="true" />}
      />
    </div>
  )
}
