import { cn } from '@/lib/utils'

type Badge = 'Observer' | 'Contributor' | 'Expert'

interface ReputationBadgeProps {
  badge: string
  score?: number
  size?: 'sm' | 'xs'
  showScore?: boolean
}

const BADGE_STYLES: Record<Badge, string> = {
  Observer:    'bg-muted text-muted-foreground border-border',
  Contributor: 'bg-primary/10 text-primary border-primary/20',
  Expert:      'bg-amber-500/10 text-amber-600 border-amber-500/25',
}

export function ReputationBadge({ badge, score, size = 'xs', showScore = false }: ReputationBadgeProps) {
  const style = BADGE_STYLES[badge as Badge] ?? BADGE_STYLES.Observer

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border rounded-none font-medium',
        size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        style,
      )}
      title={`${badge}${score !== undefined ? ` · ${score} pts` : ''}`}
    >
      {badge === 'Expert'      && <span aria-hidden="true">★</span>}
      {badge === 'Contributor' && <span aria-hidden="true">◆</span>}
      {badge}
      {showScore && score !== undefined && (
        <span className="opacity-60 tabular-nums">· {score}</span>
      )}
    </span>
  )
}
