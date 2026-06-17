import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface ScoreGaugeProps {
  score: number
  riskLevel: RiskLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SCORE_COLOR: Record<RiskLevel, string> = {
  Low: 'text-[oklch(0.45_0.14_145)]',
  Medium: 'text-[oklch(0.55_0.16_65)]',
  High: 'text-[oklch(0.52_0.18_40)]',
  Critical: 'text-[oklch(0.48_0.20_27)]',
}

const BAR_COLOR: Record<RiskLevel, string> = {
  Low: 'bg-[oklch(0.52_0.14_145)]',
  Medium: 'bg-[oklch(0.72_0.17_75)]',
  High: 'bg-[oklch(0.62_0.2_45)]',
  Critical: 'bg-[oklch(0.52_0.22_27)]',
}

export function ScoreBar({ score, riskLevel, className }: Omit<ScoreGaugeProps, 'size'>) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', BAR_COLOR[riskLevel])}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Rule clarity score: ${score} out of 100`}
        />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums', SCORE_COLOR[riskLevel])}>
        {score}
      </span>
    </div>
  )
}

export function ScoreGauge({ score, riskLevel, size = 'md', className }: ScoreGaugeProps) {
  const sizeMap = {
    sm: { outer: 'size-14', text: 'text-lg', label: 'text-[10px]' },
    md: { outer: 'size-20', text: 'text-2xl', label: 'text-xs' },
    lg: { outer: 'size-28', text: 'text-3xl', label: 'text-sm' },
  }
  const s = sizeMap[size]
  const radius = size === 'lg' ? 48 : size === 'md' ? 34 : 22
  const stroke = size === 'lg' ? 6 : 5
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  const strokeColor =
    riskLevel === 'Low'
      ? 'oklch(0.52 0.14 145)'
      : riskLevel === 'Medium'
      ? 'oklch(0.72 0.17 75)'
      : riskLevel === 'High'
      ? 'oklch(0.62 0.2 45)'
      : 'oklch(0.52 0.22 27)'

  const cx = size === 'lg' ? 56 : size === 'md' ? 40 : 28
  const cy = cx

  return (
    <div className={cn('relative flex items-center justify-center', s.outer, className)}>
      <svg
        viewBox={`0 0 ${cx * 2} ${cy * 2}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className={cn('font-bold tabular-nums leading-none', s.text, SCORE_COLOR[riskLevel])}>
          {score}
        </span>
        <span className={cn('text-muted-foreground leading-none mt-0.5', s.label)}>/100</span>
      </div>
    </div>
  )
}
