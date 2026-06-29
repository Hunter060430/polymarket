'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { updateDisplayName } from '@/app/actions/account'
import type { AccountData } from '@/app/actions/account'
import { Pencil, Check, X, LogOut, Wallet, MessageSquare, BarChart2, ExternalLink, Zap, Trophy, Shield, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReputationBadge } from '@/components/reputation-badge'
import { TASKS } from '@/lib/pre-season'

const RISK_COLORS: Record<string, string> = {
  low:      'text-emerald-500',
  medium:   'text-yellow-500',
  high:     'text-orange-500',
  critical: 'text-red-500',
}

function truncateAddress(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function AccountClient({ data }: { data: AccountData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Username editing
  const [editing, setEditing]   = useState(false)
  const [nameVal, setNameVal]   = useState(data.username ?? '')
  const [nameErr, setNameErr]   = useState<string | null>(null)

  function startEdit() {
    setNameVal(data.username ?? '')
    setNameErr(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setNameErr(null)
  }

  function saveName() {
    startTransition(async () => {
      const res = await updateDisplayName(nameVal)
      if (!res.ok) {
        setNameErr(res.error)
        return
      }
      setEditing(false)
      setNameErr(null)
      router.refresh()
    })
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const initial = data.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex flex-col gap-8">

      {/* ── Pre-Season summary ────────────────────────── */}
      <PreSeasonCard />

      {/* ── Profile card ──────────────────────────────── */}
      <div className="border border-border p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Avatar */}
        <div className="shrink-0">
          {data.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
              {initial}
            </div>
          )}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          {/* Display name (from OAuth / wallet, read-only) */}
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-lg font-semibold text-foreground truncate">{data.name}</h2>
            <ReputationBadge
              badge={data.reputation?.badge ?? 'Observer'}
              score={data.reputation?.score}
              size="sm"
              showScore
            />
          </div>

          {/* Username (unique, editable) */}
          {editing ? (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">@</span>
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                placeholder="username"
                className="text-sm bg-transparent border-b border-primary outline-none w-40 text-foreground"
                maxLength={30}
              />
              <button onClick={saveName} disabled={isPending} aria-label="Save username" className="text-primary hover:opacity-70 transition-opacity">
                <Check className="size-4" />
              </button>
              <button onClick={cancelEdit} aria-label="Cancel" className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-muted-foreground">
                {data.username ? `@${data.username}` : 'No username set'}
              </span>
              <button onClick={startEdit} aria-label="Edit username" className="text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="size-3" />
              </button>
            </div>
          )}
          {nameErr && <p className="text-xs text-destructive mb-1">{nameErr}</p>}
          {data.email && !data.email.endsWith('.web3') && (
            <p className="text-sm text-muted-foreground truncate">{data.email}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Joined {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="shrink-0 inline-flex items-center gap-2 text-xs tracking-[0.06em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          Sign Out
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 border border-border divide-x divide-border">
        <Stat icon={<MessageSquare className="size-4" />} label="Comments" value={data.recentComments.length} max={10} note="last 10" />
        <Stat icon={<BarChart2 className="size-4" />}    label="Risk Votes" value={data.recentVotes.length}   max={10} note="last 10" />
        <Stat icon={<Wallet className="size-4" />}       label="Wallets"    value={data.wallets.length}        max={null} note="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Connected wallets ─────────────────────── */}
        <section>
          <h3 className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">Connected Wallets</h3>
          {data.wallets.length === 0 ? (
            <div className="border border-border px-5 py-8 text-center text-sm text-muted-foreground">
              No wallets connected yet.
            </div>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {data.wallets.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wallet className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="font-mono text-sm text-foreground truncate">{truncateAddress(w.address)}</span>
                    {w.isPrimary && (
                      <span className="text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">Primary</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">Chain {w.chainId}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Sign-in providers ─────────────────────── */}
        <section>
          <h3 className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">Sign-in Methods</h3>
          <ul className="border border-border divide-y divide-border">
            {data.providers.map((p) => (
              <li key={p} className="flex items-center gap-3 px-4 py-3">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm text-foreground capitalize">{p === 'siwe' ? 'Wallet (SIWE)' : p}</span>
              </li>
            ))}
            {data.providers.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">No providers linked.</li>
            )}
          </ul>
        </section>
      </div>

      {/* ── Activity ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent comments */}
        <section>
          <h3 className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">Recent Comments</h3>
          {data.recentComments.length === 0 ? (
            <div className="border border-border px-5 py-8 text-center text-sm text-muted-foreground">No comments yet.</div>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {data.recentComments.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                      href={`/markets/${c.marketId}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{c.marketId}</span>
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent risk votes */}
        <section>
          <h3 className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">Recent Risk Votes</h3>
          {data.recentVotes.length === 0 ? (
            <div className="border border-border px-5 py-8 text-center text-sm text-muted-foreground">No risk votes yet.</div>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {data.recentVotes.map((v) => (
                <li key={v.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <Link
                    href={`/markets/${v.marketId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{v.marketId}</span>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn('text-xs font-semibold uppercase tracking-wider', RISK_COLORS[v.vote] ?? 'text-foreground')}>
                      {v.vote}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{timeAgo(v.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function PreSeasonCard() {
  const [data, setData] = useState<{
    points: number
    rank: number
    completedKeys: string[]
    eligibleBadges: { key: string; name: string }[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/pre-season/me')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  const totalTasks = TASKS.length
  const completed = data?.completedKeys.length ?? 0
  const pct = data ? Math.round((completed / totalTasks) * 100) : 0

  return (
    <Link
      href="/pre-season"
      className="block border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-5 group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs tracking-[0.1em] uppercase font-medium text-foreground">Pre-Season</span>
          <span className="relative flex size-1.5 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full size-1.5 bg-primary" />
          </span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Points</div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {data ? data.points.toLocaleString() : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Rank</div>
          <div className="text-xl font-bold text-foreground tabular-nums flex items-center gap-1">
            <Trophy className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {data ? `#${data.rank}` : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Badges</div>
          <div className="text-xl font-bold text-foreground tabular-nums flex items-center gap-1">
            <Shield className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {data ? data.eligibleBadges.length : '—'}
          </div>
        </div>
      </div>

      {/* Task progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Task progress</span>
          <span>{completed} / {totalTasks} tasks ({pct}%)</span>
        </div>
        <div className="h-1.5 bg-muted w-full">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

function Stat({
  icon, label, value, max, note,
}: {
  icon: React.ReactNode
  label: string
  value: number
  max: number | null
  note: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-5">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-2xl font-semibold text-foreground tabular-nums">
        {value}{max && value >= max ? '+' : ''}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
      {note && <span className="text-[10px] text-muted-foreground/60">{note}</span>}
    </div>
  )
}
