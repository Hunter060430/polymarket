import type { RuleClarityBreakdown } from '@/lib/types'

interface ScoreBreakdownProps {
  breakdown: RuleClarityBreakdown
}

const CRITERIA = [
  {
    key: 'timeClarity' as const,
    label: 'Time Clarity',
    max: 20,
    description: 'End date, timezone, and time-constraint specificity',
  },
  {
    key: 'resolutionSource' as const,
    label: 'Resolution Source',
    max: 20,
    description: 'Named, authoritative, and hierarchical resolution sources',
  },
  {
    key: 'outcomeDefinition' as const,
    label: 'Outcome Definition',
    max: 20,
    description: 'Clear question, binary outcomes, and YES definition',
  },
  {
    key: 'evidenceStandard' as const,
    label: 'Evidence Standard',
    max: 15,
    description: 'Accepted and excluded evidence types are defined',
  },
  {
    key: 'edgeCaseHandling' as const,
    label: 'Edge Case Handling',
    max: 15,
    description: 'Delays, revisions, cancellations, and late reporting addressed',
  },
  {
    key: 'postHocRisk' as const,
    label: 'Post-Trade Risk',
    max: 10,
    description: 'Description length, source completeness, and timing constraints',
  },
]

function getBarColor(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.8) return 'bg-[var(--risk-low)]'
  if (pct >= 0.6) return 'bg-[var(--risk-medium)]'
  if (pct >= 0.35) return 'bg-[var(--risk-high)]'
  return 'bg-[var(--risk-critical)]'
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      {CRITERIA.map(({ key, label, max, description }) => {
        const score = breakdown[key]
        const pct = Math.round((score / max) * 100)
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums ml-4 shrink-0">
                {score}/{max}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(score, max)}`}
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={`${label}: ${score} out of ${max}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
