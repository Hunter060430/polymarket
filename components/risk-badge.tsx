import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const RISK_CLASSES: Record<RiskLevel, string> = {
  Low:      'border-[var(--risk-low)]/40      text-[var(--risk-low)]      bg-[var(--risk-low)]/10',
  Medium:   'border-[var(--risk-medium)]/40   text-[var(--risk-medium)]   bg-[var(--risk-medium)]/10',
  High:     'border-[var(--risk-high)]/40     text-[var(--risk-high)]     bg-[var(--risk-high)]/10',
  Critical: 'border-[var(--risk-critical)]/40 text-[var(--risk-critical)] bg-[var(--risk-critical)]/10',
}

const RISK_DOT: Record<RiskLevel, string> = {
  Low:      'bg-[var(--risk-low)]',
  Medium:   'bg-[var(--risk-medium)]',
  High:     'bg-[var(--risk-high)]',
  Critical: 'bg-[var(--risk-critical)]',
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-[0.1em] uppercase',
        RISK_CLASSES[level],
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', RISK_DOT[level])} aria-hidden="true" />
      {level}
    </span>
  )
}
