import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const RISK_CLASSES: Record<RiskLevel, string> = {
  Low: 'bg-[oklch(0.90_0.08_145)] text-[oklch(0.28_0.1_145)] border-[oklch(0.75_0.12_145)]',
  Medium: 'bg-[oklch(0.96_0.08_75)] text-[oklch(0.40_0.14_60)] border-[oklch(0.82_0.14_75)]',
  High: 'bg-[oklch(0.96_0.09_45)] text-[oklch(0.36_0.16_40)] border-[oklch(0.78_0.16_45)]',
  Critical: 'bg-[oklch(0.95_0.10_27)] text-[oklch(0.35_0.18_27)] border-[oklch(0.72_0.18_27)]',
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-semibold text-xs border', RISK_CLASSES[level], className)}
    >
      {level}
    </Badge>
  )
}
