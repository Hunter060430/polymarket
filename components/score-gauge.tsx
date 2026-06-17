import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface ScoreGaugeProps {
  score: number
  riskLevel: RiskLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// All colors reference the --risk-* CSS variables defined in globals.css
const SCORE_TEXT_CLASS: Record<RiskLevel, string> = {
  Low:      'text-[var(--risk-low)]',
  Medium:   'text-[var(--risk-medium)]',
  High:     'text-[var(--risk-high)]',
  Critical: 'text-[var(--risk-critical)]',
}

const STROKE_VAR: Record<RiskLevel, string> = {
  Low:      'var(--risk-low)',
  Medium:   'var(--risk-medium)',
  High:     'var(--risk-high)',
  Critical: 'var(--risk-critical)',
}

export function ScoreGauge({ score, riskLevel, size = 'md', className }: ScoreGaugeProps) {
  const cfg = {
    sm: { outer: 'size-12', text: 'text-base', r: 20, stroke: 3, cx: 24 },
    md: { outer: 'size-20', text: 'text-2xl',  r: 34, stroke: 4, cx: 40 },
    lg: { outer: 'size-24', text: 'text-3xl',  r: 40, stroke: 4, cx: 48 },
  }[size]

  const circumference = 2 * Math.PI * cfg.r
  const dashOffset    = circumference - (score / 100) * circumference

  return (
    <div className={cn('relative flex items-center justify-center', cfg.outer, className)}>
      <svg
        viewBox={`0 0 ${cfg.cx * 2} ${cfg.cx * 2}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={cfg.cx} cy={cfg.cx} r={cfg.r}
          fill="none"
          stroke="currentColor"
          strokeWidth={cfg.stroke}
          className="text-muted"
        />
        {/* Fill */}
        <circle
          cx={cfg.cx} cy={cfg.cx} r={cfg.r}
          fill="none"
          stroke={STROKE_VAR[riskLevel]}
          strokeWidth={cfg.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="square"
        />
      </svg>
      <span
        className={cn('relative font-heading font-light tabular-nums leading-none', cfg.text, SCORE_TEXT_CLASS[riskLevel])}
        aria-label={`Rule clarity score: ${score} out of 100`}
      >
        {score}
      </span>
    </div>
  )
}
