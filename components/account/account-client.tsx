'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { updateDisplayName } from '@/app/actions/account'
import type { AccountData } from '@/app/actions/account'
import { Pencil, Check, X, LogOut, Wallet, MessageSquare, BarChart2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Display name editing
  const [editing, setEditing]   = useState(false)
  const [nameVal, setNameVal]   = useState(data.name)
  const [nameErr, setNameErr]   = useState<string | null>(null)

  function startEdit() {
    setNameVal(data.name)
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
          {editing ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                className="text-lg font-semibold bg-transparent border-b border-primary outline-none w-48 text-foreground"
                maxLength={40}
              />
              <button onClick={saveName} disabled={isPending} aria-label="Save name" className="text-primary hover:opacity-70 transition-opacity">
                <Check className="size-4" />
              </button>
              <button onClick={cancelEdit} aria-label="Cancel" className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground truncate">{data.name}</h2>
              <button onClick={startEdit} aria-label="Edit display name" className="text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="size-3.5" />
              </button>
            </div>
          )}
          {nameErr && <p className="text-xs text-destructive mb-1">{nameErr}</p>}
          {data.email && !data.email.endsWith('.web3') && (
            <p className="text-sm text-muted-foreground truncate">{data.email}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Joined {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
