'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { castRiskVote, type RiskTally } from '@/app/actions/community'
import { awardTask } from '@/lib/pre-season-award'
import { Users } from 'lucide-react'

type VoteKey = 'low' | 'medium' | 'high' | 'critical'

const OPTIONS: { key: VoteKey; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: 'var(--risk-low)' },
  { key: 'medium', label: 'Medium', color: 'var(--risk-medium)' },
  { key: 'high', label: 'High', color: 'var(--risk-high)' },
  { key: 'critical', label: 'Critical', color: 'var(--risk-critical)' },
]

export function CommunityRiskVote({
  marketId,
  initialTally,
}: {
  marketId: string
  initialTally: RiskTally
}) {
  const { data: session } = useSession()
  const [tally, setTally] = useState(initialTally)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function vote(key: VoteKey) {
    if (!session?.user) return
    setError(null)

    // Optimistic update
    setTally((prev) => {
      const next = { ...prev }
      if (prev.userVote && prev.userVote !== key) {
        next[prev.userVote as VoteKey] = Math.max(next[prev.userVote as VoteKey] - 1, 0)
      }
      if (prev.userVote !== key) {
        next[key] += 1
        if (!prev.userVote) next.total += 1
      }
      next.userVote = key
      return next
    })

    startTransition(async () => {
      const res = await castRiskVote(marketId, key)
      if (!res.ok) {
        setError(res.error)
        setTally(initialTally)
      } else {
        // Award pre-season points (first vote + milestones — idempotent server-side)
        awardTask('first_risk_vote')
      }
    })
  }

  const counts = { low: tally.low, medium: tally.medium, high: tally.high, critical: tally.critical }
  const max = Math.max(1, ...Object.values(counts))

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Users className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-heading text-2xl font-light text-foreground">Community Risk Vote</h2>
      </div>
      <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">
        {tally.total} {tally.total === 1 ? 'vote' : 'votes'} cast
      </p>

      {/* Distribution bars */}
      <div className="flex flex-col gap-2.5 mb-6">
        {OPTIONS.map(({ key, label, color }) => {
          const count = counts[key]
          const pct = tally.total > 0 ? Math.round((count / tally.total) * 100) : 0
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground w-16 shrink-0">{label}</span>
              <div className="flex-1 h-5 bg-secondary/40 relative overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(count / max) * 100}%`, backgroundColor: color, opacity: 0.85 }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground w-14 text-right shrink-0">
                {count} · {pct}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Voting buttons */}
      {session?.user ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            {tally.userVote ? 'Your vote (tap to change)' : 'How risky is this market?'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OPTIONS.map(({ key, label, color }) => {
              const active = tally.userVote === key
              return (
                <button
                  key={key}
                  onClick={() => vote(key)}
                  disabled={isPending}
                  className="px-3 py-2.5 text-xs uppercase tracking-wide border transition-colors disabled:opacity-60"
                  style={{
                    borderColor: active ? color : 'var(--border)',
                    color: active ? color : 'var(--muted-foreground)',
                    backgroundColor: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
                  }}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground border border-border px-4 py-3">
          <Link href="/sign-in" className="text-primary hover:underline underline-offset-4">Sign in</Link>{' '}
          to add your assessment of this market&apos;s resolution risk.
        </p>
      )}
    </div>
  )
}
