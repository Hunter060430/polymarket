'use client'

import { cn } from '@/lib/utils'
import { GENESIS_BADGES, TASKS } from '@/lib/pre-season'
import type { BadgeTier } from '@/lib/pre-season'
import { Shield, Lock } from 'lucide-react'

interface BadgeGridProps {
  eligibleBadges: BadgeTier[]
  isAuthenticated: boolean
  points: number
  completedKeys: string[]
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  amber:   { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   icon: 'text-amber-400' },
  sky:     { border: 'border-sky-500/40',     bg: 'bg-sky-500/10',     text: 'text-sky-400',     icon: 'text-sky-400' },
  emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
  violet:  { border: 'border-violet-500/40',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  icon: 'text-violet-400' },
  rose:    { border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    text: 'text-rose-400',    icon: 'text-rose-400' },
}

export function BadgeGrid({ eligibleBadges, isAuthenticated, points, completedKeys }: BadgeGridProps) {
  const eligibleKeys = new Set(eligibleBadges.map(b => b.key))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
        Genesis badges are permanently assigned and have a strictly limited supply. Once all copies of a badge are claimed, it is gone forever. Your eligibility is determined automatically by your actions during Pre-Season.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GENESIS_BADGES.map(badge => {
          const isEligible = eligibleKeys.has(badge.key)
          const colors = COLOR_MAP[badge.color] ?? COLOR_MAP.sky

          // Progress hint
          let progressHint = ''
          if (!isEligible && isAuthenticated) {
            if (badge.key === 'oracle_elite' || badge.key === 'the_architect') {
              const needed = badge.pointsRequired - points
              progressHint = needed > 0 ? `${needed.toLocaleString()} more pts needed` : 'Eligible — check rank at season end'
            }
            if (badge.key === 'shadow_analyst') {
              const analysisTasks = TASKS.filter(t => t.category === 'analysis')
              const remaining = analysisTasks.filter(t => !completedKeys.includes(t.key)).length
              progressHint = `${remaining} analysis task${remaining !== 1 ? 's' : ''} remaining`
            }
            if (badge.key === 'genesis_founder' || badge.key === 'verdict_pioneer') {
              progressHint = 'Determined by registration order'
            }
          }

          return (
            <div
              key={badge.key}
              className={cn(
                'border p-5 flex flex-col gap-3 transition-colors',
                isEligible
                  ? cn(colors.border, colors.bg)
                  : 'border-border bg-background opacity-60',
              )}
            >
              {/* Icon */}
              <div className="flex items-start justify-between">
                <div className={cn(
                  'flex items-center justify-center size-10 border',
                  isEligible ? cn(colors.border, colors.bg) : 'border-border bg-secondary/20',
                )}>
                  {isEligible ? (
                    <Shield className={cn('size-5', colors.icon)} />
                  ) : (
                    <Lock className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className={cn(
                  'text-xs font-medium px-2 py-0.5 border',
                  isEligible
                    ? cn(colors.border, colors.text)
                    : 'border-border text-muted-foreground',
                )}>
                  {badge.supply === 1 ? '1 of 1' : `/${badge.supply}`}
                </div>
              </div>

              {/* Name + description */}
              <div>
                <div className={cn('text-sm font-semibold mb-1', isEligible ? colors.text : 'text-foreground')}>
                  {badge.name}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Status */}
              <div className="mt-auto pt-3 border-t border-border/50">
                {isEligible ? (
                  <span className={cn('text-xs font-medium', colors.text)}>You are eligible</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {progressHint || (isAuthenticated ? 'Not yet eligible' : 'Sign in to check eligibility')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
