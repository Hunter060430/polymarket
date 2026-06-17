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
  Low: 'text-[var(--risk-low)]',
  Medium: 'text-[var(--risk-medium)]',
  High: 'text-[var(--risk-high)]',
  Critical: 'text-[var(--risk-critical)]',
}

const BAR_BG_CLASS: Record<RiskLevel, string> = {
  Low: 'bg-[var(--risk-low)]',
  Medium: 'bg-[var(--risk-medium)]',
  High: 'bg-[var(--risk-high)]',
  Critical: 'bg-[var(--risk-critical)]',
}

// SVG stroke uses inline style so it can reference the CSS variable at runtime
const STROKE_VAR: Record<RiskLevel, string> = {
  Low: 'var(--risk-low)',
  Medium: 'var(--risk-medium)',
  High: 'var(--risk-high)',
  Critical: 'var(--risk-critical)',
}

export function ScoreBar({ score, riskLevel, className }: Omit<ScoreGaugeProps, 'size'>) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', BAR_BG_CLASS[riskLevel])}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Rule clarity score: ${score} out of 100`}
        />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums', SCORE_TEXT_CLASS[riskLevel])}>
        {score}
      </span>
    </div>
  )
}

export function ScoreGauge({ score, riskLevel, size = 'md', className }: ScoreGaugeProps) {
  const sizeMap = {
    sm: { outer: 'size-14', text: 'text-lg', label: 'text-[10px]', r: 22, stroke: 5, cx: 28 },
    md: { outer: 'size-20', text: 'text-2xl', label: 'text-xs',    r: 34, stroke: 5, cx: 40 },
    lg: { outer: 'size-28', text: 'text-3xl', label: 'text-sm',    r: 48, stroke: 6, cx: 56 },
  }
  const { outer, text, label, r, stroke, cx } = sizeMap[size]
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className={cn('relative flex items-center justify-center', outer, className)}>
      <svg
        viewBox={`0 0 ${cx * 2} ${cx * 2}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={STROKE_VAR[riskLevel]}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className={cn('font-bold tabular-nums leading-none', text, SCORE_TEXT_CLASS[riskLevel])}>
          {score}
        </span>
        <span className={cn('text-muted-foreground leading-none mt-0.5', label)}>/100</span>
      </div>
    </div>
  )
}
