import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

// All colors reference the --risk-* CSS variables defined in globals.css
const RISK_CLASSES: Record<RiskLevel, string> = {
  Low:      'border-[var(--risk-low)] text-[var(--risk-low)]',
  Medium:   'border-[var(--risk-medium)] text-[var(--risk-medium)]',
  High:     'border-[var(--risk-high)] text-[var(--risk-high)]',
  Critical: 'border-[var(--risk-critical)] text-[var(--risk-critical)]',
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium text-xs border bg-transparent', RISK_CLASSES[level], className)}
    >
      {level}
    </Badge>
  )
}
