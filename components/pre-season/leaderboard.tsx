'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Trophy, Medal } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  points: number
  name: string
  username: string | null
  image: string | null
  updatedAt: string
}

interface LeaderboardProps {
  currentUserId?: string
}

const RANK_STYLE: Record<number, { icon: React.ReactNode; row: string; rank: string }> = {
  1: { icon: <Trophy className="size-4 text-amber-400" />,  row: 'bg-amber-500/5 border-amber-500/20',  rank: 'text-amber-400 font-bold' },
  2: { icon: <Medal className="size-4 text-slate-300" />,   row: 'bg-secondary/20',                     rank: 'text-slate-300 font-bold' },
  3: { icon: <Medal className="size-4 text-amber-700" />,   row: 'bg-secondary/10',                     rank: 'text-amber-700 font-bold' },
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pre-season/leaderboard')
      .then(r => r.json())
      .then((d: { leaderboard: LeaderboardEntry[] }) => setEntries(d.leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="border border-border">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 animate-pulse">
            <div className="w-8 h-4 bg-muted" />
            <div className="flex-1 h-4 bg-muted" />
            <div className="w-16 h-4 bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <Trophy className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No entries yet. Complete tasks to be the first on the leaderboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top 3 podium */}
      {entries.length >= 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {entries.slice(0, 3).map(entry => {
            const style = RANK_STYLE[entry.rank]
            const isYou = entry.userId === currentUserId
            return (
              <div key={entry.userId} className={cn('border p-4 flex flex-col items-center text-center gap-2', style?.row ?? 'border-border bg-background')}>
                <div className="flex items-center gap-1.5">
                  {style?.icon}
                  <span className={cn('text-lg font-bold', style?.rank ?? 'text-foreground')}>
                    #{entry.rank}
                  </span>
                </div>
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                  {entry.image ? (
                    <img src={entry.image} alt="" className="size-10 object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {(entry.username ?? entry.name ?? '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {entry.username ? `@${entry.username}` : entry.name}
                    {isYou && <span className="ml-1 text-xs text-primary">(you)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{entry.points.toLocaleString()} pts</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium w-12">#</th>
              <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Analyst</th>
              <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map(entry => {
              const isYou = entry.userId === currentUserId
              const podiumStyle = RANK_STYLE[entry.rank]
              return (
                <tr
                  key={entry.userId}
                  className={cn(
                    'transition-colors',
                    isYou ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-secondary/10',
                    podiumStyle?.row,
                  )}
                >
                  <td className={cn('px-4 py-3 text-xs tabular-nums', podiumStyle?.rank ?? 'text-muted-foreground')}>
                    {entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border shrink-0">
                        {entry.image ? (
                          <img src={entry.image} alt="" className="size-6 object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-foreground">
                            {(entry.username ?? entry.name ?? '?')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-foreground text-sm">
                        {entry.username ? `@${entry.username}` : entry.name}
                      </span>
                      {isYou && <span className="text-xs text-primary font-medium">you</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                    {entry.points.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
