'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIMENSION_LABELS } from '@/lib/rule-clarity-score'
import type { RuleClarityBreakdown, ScoreTraceEntry } from '@/lib/types'

interface ScoringTraceProps {
  trace: Record<keyof RuleClarityBreakdown, ScoreTraceEntry[]>
  breakdown: RuleClarityBreakdown
}

const DIM_ORDER: (keyof RuleClarityBreakdown)[] = [
  'timeClarity', 'resolutionSource', 'outcomeDefinition',
  'evidenceStandard', 'edgeCaseHandling', 'postHocRisk',
]

export function ScoringTrace({ trace, breakdown }: ScoringTraceProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left hover:bg-secondary/25 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-foreground">Scoring trace</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every rule that fired, and the points it added or removed.
          </p>
        </div>
        <ChevronDown
          className={cn('size-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {DIM_ORDER.map((dim) => {
            const entries = trace[dim] ?? []
            const meta = DIMENSION_LABELS[dim]
            return (
              <div key={dim} className="px-4 sm:px-5 py-4">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <p className="text-xs tracking-[0.08em] uppercase text-foreground">{meta.label}</p>
                  <p className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {breakdown[dim]} / {meta.max}
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {entries.map((e, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs">
                      <span
                        className={cn(
                          'tabular-nums font-mono w-9 shrink-0 text-right',
                          e.delta > 0 ? 'text-[var(--risk-low)]' : e.delta < 0 ? 'text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {e.delta > 0 ? '+' : ''}{e.delta}
                      </span>
                      <span className="text-muted-foreground flex-1">{e.rule}</span>
                      {e.matched && (
                        <span className="text-foreground/70 font-mono border border-border px-1.5 py-0.5 shrink-0 max-w-[40%] truncate">
                          {e.matched}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <p className="px-4 sm:px-5 py-3 text-xs text-muted-foreground bg-secondary/20">
            Scores are produced by a transparent rule-based engine, not a black box. These
            traces show exactly which terms in the market text triggered each adjustment.
          </p>
        </div>
      )}
    </div>
  )
}
