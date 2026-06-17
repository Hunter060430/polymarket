import { DIMENSION_LABELS } from '@/lib/rule-clarity-score'
import type { RuleClarityBreakdown, RuleClarityScore } from '@/lib/types'

interface ScoreBreakdownProps {
  score: RuleClarityScore
}

function barColor(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.8) return 'var(--risk-low)'
  if (pct >= 0.6) return 'var(--risk-medium)'
  if (pct >= 0.35) return 'var(--risk-high)'
  return 'var(--risk-critical)'
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const { breakdown, dimensionDetails } = score
  const keys = Object.keys(DIMENSION_LABELS) as (keyof RuleClarityBreakdown)[]

  return (
    <div className="divide-y divide-border border border-border">
      {keys.map((key) => {
        const { label, max, description } = DIMENSION_LABELS[key]
        const raw    = breakdown[key]
        const pct    = Math.round((raw / max) * 100)
        const color  = barColor(raw, max)
        const detail = dimensionDetails?.[key]

        return (
          <div key={key} className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[180px_1fr_52px] gap-3 sm:gap-6 items-start sm:items-center">

            {/* Label + static description */}
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
            </div>

            {/* Bar + per-dimension explanation */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div
                className="h-[3px] w-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={raw}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={`${label}: ${raw} out of ${max}`}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              {detail && (
                <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
              )}
            </div>

            {/* Score */}
            <p
              className="text-sm font-medium tabular-nums sm:text-right"
              style={{ color }}
            >
              {raw}<span className="text-muted-foreground font-normal text-xs">/{max}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
