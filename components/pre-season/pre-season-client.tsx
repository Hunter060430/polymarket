'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { TASKS, GENESIS_BADGES, PRESEASON_END } from '@/lib/pre-season'
import type { TaskDef, BadgeTier } from '@/lib/pre-season'
import { TaskBoard } from './task-board'
import { BadgeGrid } from './badge-grid'
import { Leaderboard } from './leaderboard'
import { cn } from '@/lib/utils'
import { Trophy, Zap, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

interface MeData {
  points: number
  rank: number
  completedKeys: string[]
  taskProgress: (TaskDef & { completed: boolean })[]
  eligibleBadges: BadgeTier[]
}

type Tab = 'tasks' | 'badges' | 'leaderboard'

function Countdown() {
  const [diff, setDiff] = useState('')

  useEffect(() => {
    function compute() {
      const now = Date.now()
      const end = PRESEASON_END.getTime()
      const ms = Math.max(0, end - now)
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setDiff(`${d}d ${h}h ${m}m ${s}s`)
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [])

  return <span className="font-mono tabular-nums">{diff}</span>
}

export function PreSeasonClient() {
  const { data: session, isPending } = useSession()
  const [me, setMe] = useState<MeData | null>(null)
  const [tab, setTab] = useState<Tab>('tasks')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    setLoading(true)
    fetch('/api/pre-season/me')
      .then(r => r.json())
      .then((d: MeData) => setMe(d))
      .finally(() => setLoading(false))
  }, [session?.user])

  const totalPossible = TASKS.reduce((sum, t) => sum + t.points, 0)
  const completedCount = me?.completedKeys.length ?? 0
  const pct = me ? Math.round((me.points / totalPossible) * 100) : 0

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tasks',       label: 'Tasks',       icon: <Zap className="size-3.5" /> },
    { key: 'badges',      label: 'Genesis Badges', icon: <Shield className="size-3.5" /> },
    { key: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="size-3.5" /> },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="border border-border bg-secondary/20 p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary font-medium mb-4">
              PRE-SEASON ACTIVE
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-3">
              Genesis Protocol
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              Complete tasks to earn Verdict Points before Season 1 launches. The highest-ranked analysts at season end will receive exclusive Genesis badges — permanently marking them as early believers in transparent prediction markets.
            </p>
          </div>

          {/* Season countdown */}
          <div className="border border-border bg-background p-5 min-w-[200px]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Clock className="size-3.5" />
              Season ends in
            </div>
            <div className="text-xl font-bold text-foreground">
              <Countdown />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Sep 1, 2026 · 00:00 UTC
            </div>
          </div>
        </div>

        {/* Stats row */}
        {session?.user && me && (
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Your Points</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{me.points.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Leaderboard Rank</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">#{me.rank}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tasks Completed</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{completedCount} / {TASKS.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Genesis Badges</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{me.eligibleBadges.length}</div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {session?.user && me && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Season progress</span>
              <span>{me.points} / {totalPossible} pts ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-muted w-full">
              <div
                className="h-full bg-primary transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Unauthenticated CTA */}
        {!isPending && !session?.user && (
          <div className="mt-6 pt-6 border-t border-border flex items-center gap-4">
            <p className="text-sm text-muted-foreground">Sign in to start earning points and tracking your Genesis badge eligibility.</p>
            <Link href="/sign-in" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-border mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {tab === 'tasks' && (
        <TaskBoard
          taskProgress={me?.taskProgress ?? TASKS.map(t => ({ ...t, completed: false }))}
          isAuthenticated={!!session?.user}
          loading={loading}
        />
      )}
      {tab === 'badges' && (
        <BadgeGrid
          eligibleBadges={me?.eligibleBadges ?? []}
          isAuthenticated={!!session?.user}
          points={me?.points ?? 0}
          completedKeys={me?.completedKeys ?? []}
        />
      )}
      {tab === 'leaderboard' && (
        <Leaderboard currentUserId={session?.user?.id} />
      )}
    </main>
  )
}
