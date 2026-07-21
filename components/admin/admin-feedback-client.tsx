'use client'

import { useState, useTransition } from 'react'
import { setFeedbackStatus, type AdminFeedback } from '@/app/actions/admin'
import { ExternalLink, Loader2 } from 'lucide-react'

type Status = 'open' | 'in-progress' | 'resolved' | 'dismissed'

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  { value: 'in-progress', label: 'In Progress', color: 'text-blue-500 border-blue-500/30 bg-blue-500/5' },
  { value: 'resolved', label: 'Resolved', color: 'text-emerald-600 border-emerald-600/30 bg-emerald-600/5' },
  { value: 'dismissed', label: 'Dismissed', color: 'text-muted-foreground border-border' },
]

const CATEGORY_LABELS: Record<string, string> = {
  feedback: 'Feedback',
  bug: 'Bug',
  data: 'Data Issue',
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

function StatusChip({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]
  return (
    <span className={`inline-block border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${opt.color}`}>
      {opt.label}
    </span>
  )
}

export function AdminFeedbackClient({ feedback: initial }: { feedback: AdminFeedback[] }) {
  const [feedback, setFeedback] = useState(initial)
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('open')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<number | null>(null)

  const openCount = feedback.filter((f) => f.status === 'open').length
  const inProgressCount = feedback.filter((f) => f.status === 'in-progress').length

  const filtered = feedback.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false
    if (catFilter !== 'all' && f.category !== catFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !f.message.toLowerCase().includes(q) &&
        !(f.email ?? '').toLowerCase().includes(q) &&
        !(f.userName ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  function handleStatus(id: number, status: Status) {
    setPendingId(id)
    startTransition(async () => {
      await setFeedbackStatus(id, status)
      setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, status } : f))
      setPendingId(null)
    })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Summary */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-medium">Feedback</h1>
        <div className="flex gap-4 ml-auto text-xs text-muted-foreground">
          {openCount > 0 && <span className="text-amber-500 font-medium">{openCount} open</span>}
          {inProgressCount > 0 && <span className="text-blue-500 font-medium">{inProgressCount} in progress</span>}
          <span>{feedback.length} total</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search message, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground w-56"
        />

        {/* Status filter */}
        <div className="flex gap-1">
          {(['all', 'open', 'in-progress', 'resolved', 'dismissed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs capitalize tracking-wider transition-colors ${
                statusFilter === s ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-1">
          {(['all', 'feedback', 'bug', 'data'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-2 text-xs capitalize tracking-wider transition-colors ${
                catFilter === c ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c === 'all' ? 'All types' : CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} items</span>
      </div>

      {/* Feedback list */}
      <div className="divide-y divide-border border border-border">
        {filtered.map((f) => (
          <div key={f.id} className="px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start gap-3">
              {/* Left: meta */}
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[f.category] ?? f.category}
                  </span>
                  <StatusChip status={f.status} />
                  <span className="text-xs text-muted-foreground">{formatDate(f.createdAt)}</span>
                </div>

                {/* Author */}
                <div className="mb-2 text-xs text-muted-foreground">
                  {f.userName ? (
                    <span>{f.userName} ({f.email})</span>
                  ) : f.email ? (
                    <span>{f.email}</span>
                  ) : (
                    <span className="italic">Anonymous</span>
                  )}
                </div>

                {/* Message */}
                <p
                  className={`text-sm leading-relaxed ${expanded === f.id ? '' : 'line-clamp-3'}`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {f.message}
                </p>
                {f.message.length > 200 && (
                  <button
                    onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    className="mt-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    {expanded === f.id ? 'Show less' : 'Show more'}
                  </button>
                )}

                {/* Page URL */}
                {f.pageUrl && (
                  <a
                    href={f.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="size-3" aria-hidden="true" />
                    {f.pageUrl.length > 60 ? f.pageUrl.slice(0, 60) + '…' : f.pageUrl}
                  </a>
                )}
              </div>

              {/* Right: status actions */}
              <div className="flex shrink-0 flex-col gap-1">
                {STATUS_OPTIONS.filter((s) => s.value !== f.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatus(f.id, s.value)}
                    disabled={isPending && pendingId === f.id}
                    className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    {isPending && pendingId === f.id ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                    ) : null}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No feedback matching current filters.
          </div>
        )}
      </div>
    </main>
  )
}
