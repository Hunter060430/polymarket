import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const RISK_CLASSES: Record<RiskLevel, string> = {
  Low:      'border-[var(--risk-low)]      text-[var(--risk-low)]',
  Medium:   'border-[var(--risk-medium)]   text-[var(--risk-medium)]',
  High:     'border-[var(--risk-high)]     text-[var(--risk-high)]',
  Critical: 'border-[var(--risk-critical)] text-[var(--risk-critical)]',
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block border px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase bg-transparent',
        RISK_CLASSES[level],
        className
      )}
    >
      {level}
    </span>
  )
}
