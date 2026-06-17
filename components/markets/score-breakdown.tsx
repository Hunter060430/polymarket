import type { RuleClarityBreakdown } from '@/lib/types'

interface ScoreBreakdownProps {
  breakdown: RuleClarityBreakdown
}

const CRITERIA = [
  { key: 'timeClarity'       as const, label: 'Time Clarity',       max: 20, desc: 'End date, timezone, and temporal constraint specificity' },
  { key: 'resolutionSource'  as const, label: 'Resolution Source',  max: 20, desc: 'Named, authoritative, and hierarchical resolution sources' },
  { key: 'outcomeDefinition' as const, label: 'Outcome Definition', max: 20, desc: 'Clear question, binary outcomes, and YES definition' },
  { key: 'evidenceStandard'  as const, label: 'Evidence Standard',  max: 15, desc: 'Accepted and excluded evidence types are defined' },
  { key: 'edgeCaseHandling'  as const, label: 'Edge Case Handling', max: 15, desc: 'Delays, revisions, cancellations, and late reporting addressed' },
  { key: 'postHocRisk'       as const, label: 'Post-Trade Risk',    max: 10, desc: 'Description depth, source completeness, and timing constraints' },
]

function barColor(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.8) return 'var(--risk-low)'
  if (pct >= 0.6) return 'var(--risk-medium)'
  if (pct >= 0.35) return 'var(--risk-high)'
  return 'var(--risk-critical)'
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="divide-y divide-border border-t border-border">
      {CRITERIA.map(({ key, label, max, desc }) => {
        const score = breakdown[key]
        const pct   = Math.round((score / max) * 100)
        const color = barColor(score, max)
        return (
          <div key={key} className="py-5 grid grid-cols-1 sm:grid-cols-[200px_1fr_60px] gap-3 sm:gap-6 items-center">
            {/* Label */}
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
            </div>

            {/* Bar — sharp, no border-radius */}
            <div
              className="h-1 w-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-label={`${label}: ${score} out of ${max}`}
            >
              <div
                className="h-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>

            {/* Score */}
            <p
              className="text-sm font-medium tabular-nums text-right"
              style={{ color }}
            >
              {score}<span className="text-muted-foreground font-normal">/{max}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
