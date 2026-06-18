'use client'

import { Star } from 'lucide-react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { cn } from '@/lib/utils'

interface StarButtonProps {
  marketId: string
  className?: string
}

export function StarButton({ marketId, className }: StarButtonProps) {
  const { toggle, isStarred } = useWatchlist()
  const starred = isStarred(marketId)

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(marketId) }}
      aria-label={starred ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-pressed={starred}
      className={cn(
        'shrink-0 transition-colors',
        starred
          ? 'text-primary hover:text-primary/70'
          : 'text-muted-foreground/40 hover:text-muted-foreground',
        className
      )}
    >
      <Star
        className="size-4"
        fill={starred ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    </button>
  )
}
