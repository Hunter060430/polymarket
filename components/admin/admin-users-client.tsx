'use client'

import { useState, useTransition } from 'react'
import { setUserRole, getUserActivity, type AdminUser } from '@/app/actions/admin'
import { ChevronDown, ChevronUp, Loader2, MessageSquare, ShieldCheck, X } from 'lucide-react'

type Stats = { totalUsers: number; totalComments: number; openFeedback: number; inProgressFeedback: number; resolvedFeedback: number }

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d))
}

function BadgeChip({ badge }: { badge: string }) {
  const color =
    badge === 'Expert'
      ? 'text-amber-500 border-amber-500/30 bg-amber-500/5'
      : badge === 'Contributor'
        ? 'text-blue-500 border-blue-500/30 bg-blue-500/5'
        : 'text-muted-foreground border-border'
  return (
    <span className={`inline-block border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${color}`}>
      {badge}
    </span>
  )
}

type ActivityData = Awaited<ReturnType<typeof getUserActivity>>

export function AdminUsersClient({ users: initial, stats }: { users: AdminUser[]; stats: Stats }) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [sortKey, setSortKey] = useState<'createdAt' | 'score' | 'commentCount'>('createdAt')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [detail, setDetail] = useState<AdminUser | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingRole, setPendingRole] = useState<string | null>(null)

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = users
    .filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'createdAt') return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      if (sortKey === 'score') return dir * (a.score - b.score)
      return dir * (a.commentCount - b.commentCount)
    })

  function handleRoleChange(userId: string, newRole: 'user' | 'admin') {
    if (!confirm(`Change role to ${newRole}?`)) return
    setPendingRole(userId)
    startTransition(async () => {
      await setUserRole(userId, newRole)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      if (detail?.id === userId) setDetail((d) => d ? { ...d, role: newRole } : d)
      setPendingRole(null)
    })
  }

  async function openDetail(u: AdminUser) {
    setDetail(u)
    setActivity(null)
    setActivityLoading(true)
    const data = await getUserActivity(u.id)
    setActivity(data)
    setActivityLoading(false)
  }

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col
      ? sortDir === 'desc' ? <ChevronDown className="size-3 inline-block ml-0.5" /> : <ChevronUp className="size-3 inline-block ml-0.5" />
      : null

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Users', value: stats.totalUsers },
            { label: 'Total Comments', value: stats.totalComments },
            { label: 'Open Feedback', value: stats.openFeedback },
            { label: 'Resolved Feedback', value: stats.resolvedFeedback },
          ].map((s) => (
            <div key={s.label} className="border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="mt-1 text-2xl font-light tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search name, email, username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground w-64"
          />
          <div className="flex gap-1">
            {(['all', 'user', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                  roleFilter === r ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'all' ? 'All' : r === 'admin' ? 'Admins' : 'Users'}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} users</span>
        </div>

        {/* Table */}
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Badge</th>
                <th
                  className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('score')}
                >
                  Score <SortIcon col="score" />
                </th>
                <th
                  className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('commentCount')}
                >
                  Comments <SortIcon col="commentCount" />
                </th>
                <th
                  className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground hidden sm:table-cell"
                  onClick={() => toggleSort('createdAt')}
                >
                  Joined <SortIcon col="createdAt" />
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">Sessions</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.username && <p className="text-xs text-muted-foreground/60">@{u.username}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-wider ${u.role === 'admin' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {u.role === 'admin' && <ShieldCheck className="size-3 inline-block mr-1" aria-hidden="true" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3"><BadgeChip badge={u.badge} /></td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm">{u.score}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm">{u.commentCount}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{u.sessionCount > 0 ? <span className="text-emerald-600">{u.sessionCount} active</span> : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openDetail(u)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="View activity"
                      >
                        <MessageSquare className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                        disabled={isPending && pendingRole === u.id}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                        title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                      >
                        {isPending && pendingRole === u.id
                          ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          : <ShieldCheck className="size-3.5" aria-hidden="true" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">No users found.</div>
          )}
        </div>
      </main>

      {/* User detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/85 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto max-w-2xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-medium">{detail.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{detail.email}</p>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close">
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Profile summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Score', value: detail.score },
                  { label: 'Comments', value: detail.commentCount },
                  { label: 'Votes', value: detail.voteCount },
                ].map((s) => (
                  <div key={s.label} className="border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="mt-1 text-xl font-light tabular-nums">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Joined {formatDate(detail.createdAt)}</span>
                <span>·</span>
                <BadgeChip badge={detail.badge} />
                <span>·</span>
                <span className={detail.role === 'admin' ? 'text-amber-500' : ''}>{detail.role}</span>
                {detail.sessionCount > 0 && <><span>·</span><span className="text-emerald-600">{detail.sessionCount} active session(s)</span></>}
              </div>

              {/* Activity feed */}
              {activityLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {activity && (
                <>
                  {activity.comments.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Recent Comments</p>
                      <div className="space-y-2">
                        {activity.comments.map((c) => (
                          <div key={c.id} className="border border-border p-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs text-muted-foreground font-mono truncate">{c.marketId}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{formatDate(c.createdAt)}</span>
                            </div>
                            <p className="text-sm line-clamp-3">{c.body}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{c.upvotes} upvotes</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activity.votes.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Recent Risk Votes</p>
                      <div className="space-y-1">
                        {activity.votes.map((v, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                            <span className="text-xs font-mono text-muted-foreground truncate">{v.marketId}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs uppercase tracking-wider ${
                                v.vote === 'critical' ? 'text-red-500' :
                                v.vote === 'high' ? 'text-orange-500' :
                                v.vote === 'medium' ? 'text-yellow-500' : 'text-emerald-500'
                              }`}>{v.vote}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activity.comments.length === 0 && activity.votes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-border px-5 py-4">
              <button
                onClick={() => handleRoleChange(detail.id, detail.role === 'admin' ? 'user' : 'admin')}
                disabled={isPending && pendingRole === detail.id}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-wider hover:bg-secondary transition-colors disabled:opacity-40"
              >
                {isPending && pendingRole === detail.id && <Loader2 className="size-3 animate-spin" />}
                {detail.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
              </button>
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-muted-foreground">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
