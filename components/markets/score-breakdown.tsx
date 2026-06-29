'use client'

import { HelpCircle } from 'lucide-react'
import { DIMENSION_LABELS } from '@/lib/rule-clarity-score'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { RuleClarityBreakdown, RuleClarityScore } from '@/lib/types'

// Plain-language explanations of how each dimension is scored
const DIMENSION_EXPLAINERS: Record<keyof RuleClarityBreakdown, string> = {
  timeClarity:
    'Scored 0–20. Full marks require a specific date, an explicit time anchor (e.g. "by", "before"), and a named timezone. Vague language like "end of year" or missing time context lowers this score.',
  resolutionSource:
    'Scored 0–20. Full marks require a named, authoritative source with a verifiable URL (e.g. SEC filing, government data). Markets that rely on "credible reporting" or leave the source unspecified score lower.',
  outcomeDefinition:
    'Scored 0–20. Full marks require a clear binary YES/NO condition with explicit resolution language. Ambiguous words like "significant", "major", or "reportedly" reduce this score.',
  evidenceStandard:
    'Scored 0–15. Measures whether the market rules specify what counts as valid evidence — e.g. screenshots, official statements, on-chain data. No evidence guidance means resolution relies on subjective judgment.',
  edgeCaseHandling:
    'Scored 0–15. Checks whether the rules address unexpected scenarios: delays, postponements, data revisions, cancellations, or disputes. Markets with short descriptions and no edge-case language score low here.',
  postHocRisk:
    'Scored 0–10. Estimates the risk of retroactive re-interpretation after the market closes. Triggers include vague confirmation language ("confirmed", "announced") without a defined timing constraint, or very short descriptions.',
}

interface ScoreBreakdownProps {
  breakdown: RuleClarityScore['breakdown']
  dimensionDetails?: RuleClarityScore['dimensionDetails']
}

function barColor(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.8) return 'var(--risk-low)'
  if (pct >= 0.6) return 'var(--risk-medium)'
  if (pct >= 0.35) return 'var(--risk-high)'
  return 'var(--risk-critical)'
}

export function ScoreBreakdown({ breakdown, dimensionDetails }: ScoreBreakdownProps) {
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
          <div
            key={key}
            className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[180px_1fr_52px] gap-3 sm:gap-6 items-start sm:items-center"
          >
            {/* Label + static description + tooltip trigger */}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                    aria-label={`How ${label} is scored`}
                  >
                    <HelpCircle className="size-3.5" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="max-w-[260px] leading-relaxed text-xs">
                    {DIMENSION_EXPLAINERS[key]}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
            </div>

            {/* Bar + per-dimension explanation */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div
                className="h-2 w-full bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={raw}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={`${label}: ${raw} out of ${max}`}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
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
