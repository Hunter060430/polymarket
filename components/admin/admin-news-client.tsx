'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  createNewsPost, deleteNewsPost, setNewsMarketOverride, updateNewsPost,
  type NewsCategory, type NewsInput,
} from '@/app/actions/news'
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

type Post = {
  id: number; slug: string; title: string; summary: string; body: string
  category: string; sourceUrl: string | null; sourceName: string | null
  reportedAt: Date | null; verifiedAt: Date | null; published: boolean
  publishedAt: Date | null; createdAt: Date
}
type FormState = NewsInput & { id?: number }

const CATEGORIES: Array<{ value: NewsCategory; label: string }> = [
  { value: 'news', label: 'News' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'product-update', label: 'Product Update' },
]
const EMPTY_FORM: FormState = {
  title: '', summary: '', body: '', category: 'news', sourceUrl: '', sourceName: '',
  reportedAt: new Date().toISOString().slice(0, 10), published: false,
}

function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : '—'
}

export function AdminNewsClient({ posts: initialPosts, adminName }: { posts: Post[]; adminName: string }) {
  const [posts, setPosts] = useState(initialPosts)
  const [form, setForm] = useState<FormState | null>(null)
  const [override, setOverride] = useState({ id: '', question: '', mode: 'include' as 'include' | 'exclude' })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openEdit(post: Post) {
    setForm({
      id: post.id, title: post.title, summary: post.summary, body: post.body,
      category: (['news', 'analysis', 'product-update'].includes(post.category) ? post.category : post.category === 'analysis' ? 'analysis' : 'news') as NewsCategory,
      sourceUrl: post.sourceUrl ?? '', sourceName: post.sourceName ?? '',
      reportedAt: post.reportedAt ? new Date(post.reportedAt).toISOString().slice(0, 10) : '',
      published: post.published,
    })
    setError(null); setNotice(null)
  }

  function handleSave() {
    if (!form) return
    setError(null); setNotice(null)
    startTransition(async () => {
      try {
        if (form.id) await updateNewsPost(form.id, form)
        else await createNewsPost(form)
        window.location.reload()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Failed to save post.')
      }
    })
  }

  function handleOverride() {
    if (!form?.id || !override.id.trim() || !override.question.trim()) {
      setError('Market ID and question are required for a manual relationship.')
      return
    }
    startTransition(async () => {
      try {
        await setNewsMarketOverride(form.id!, { id: override.id.trim(), question: override.question.trim() }, override.mode)
        setOverride({ id: '', question: '', mode: 'include' })
        setNotice(override.mode === 'include' ? 'Market pinned to this story.' : 'Market excluded from automatic matches.')
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Failed to save relationship.')
      }
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    startTransition(async () => {
      try { await deleteNewsPost(id); setPosts((current) => current.filter((post) => post.id !== id)) }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to delete post.') }
    })
  }

  const fieldClass = 'w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground'
  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between"><div><h1 className="text-xl font-medium">News desk</h1><p className="mt-1 text-xs text-muted-foreground">Sources are mandatory before publishing. Duplicate titles and URLs are blocked.</p></div><button onClick={() => { setForm({ ...EMPTY_FORM }); setError(null); setNotice(null) }} className="inline-flex items-center gap-2 bg-foreground px-4 py-2 text-sm text-background"><Plus className="size-4" /> New post</button></div>
        {error && !form && <p className="mb-4 border-l-2 border-destructive pl-3 text-xs text-destructive">{error}</p>}
        <div className="divide-y divide-border border border-border">
          {posts.map((post) => <article key={post.id} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
            <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{post.category}</span>{post.published ? <span className="inline-flex items-center gap-1 text-[10px] uppercase text-emerald-600"><Eye className="size-3" /> Published {formatDate(post.publishedAt)}</span> : <span className="inline-flex items-center gap-1 text-[10px] uppercase text-muted-foreground"><EyeOff className="size-3" /> Draft</span>}{post.verifiedAt && <span className="text-[10px] uppercase text-muted-foreground">Verified {formatDate(post.verifiedAt)}</span>}</div><h2 className="truncate text-sm font-medium">{post.title}</h2><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{post.sourceName ?? 'Source missing'} · Reported {formatDate(post.reportedAt)}</p></div>
            <div className="flex shrink-0 items-center">{post.published && <Link href={`/news/${post.slug}`} target="_blank" className="p-2 text-muted-foreground hover:text-foreground" aria-label="View post"><ExternalLink className="size-4" /></Link>}<button onClick={() => openEdit(post)} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Edit post"><Pencil className="size-4" /></button><button onClick={() => handleDelete(post.id)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Delete post"><Trash2 className="size-4" /></button></div>
          </article>)}
        </div>
      </main>

      {form && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/85 p-4 backdrop-blur-sm sm:p-8"><div className="mx-auto max-w-3xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-medium">{form.id ? 'Edit post' : 'New post'}</h2><p className="mt-1 text-xs text-muted-foreground">Editorial verification is recorded each time a story is published.</p></div><button onClick={() => setForm(null)} aria-label="Close editor"><X className="size-4" /></button></div>
        <div className="flex flex-col gap-4 px-5 py-5">
          {error && <p className="border-l-2 border-destructive pl-3 text-xs text-destructive">{error}</p>}{notice && <p className="border-l-2 border-emerald-600 pl-3 text-xs text-emerald-600">{notice}</p>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as NewsCategory })} className={`${fieldClass} mt-1.5`}>{CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="text-xs text-muted-foreground">Reported date<input type="date" value={form.reportedAt} onChange={(e) => setForm({ ...form, reportedAt: e.target.value })} className={`${fieldClass} mt-1.5`} /></label></div>
          <label className="text-xs text-muted-foreground">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${fieldClass} mt-1.5`} /></label>
          <label className="text-xs text-muted-foreground">Summary<textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={`${fieldClass} mt-1.5 resize-none`} /></label>
          <label className="text-xs text-muted-foreground">Body<textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={`${fieldClass} mt-1.5 resize-y font-mono`} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Source name<input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} placeholder="Reuters, CFTC, Polymarket…" className={`${fieldClass} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Source URL<input type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://…" className={`${fieldClass} mt-1.5`} /></label></div>
          {form.id && <fieldset className="border border-border p-4"><legend className="px-2 text-xs font-medium">Manual market relationship</legend><div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><input value={override.id} onChange={(e) => setOverride({ ...override, id: e.target.value })} placeholder="Market ID" className={fieldClass} /><input value={override.question} onChange={(e) => setOverride({ ...override, question: e.target.value })} placeholder="Market question" className={fieldClass} /><select value={override.mode} onChange={(e) => setOverride({ ...override, mode: e.target.value as 'include' | 'exclude' })} className={fieldClass}><option value="include">Pin</option><option value="exclude">Exclude</option></select></div><button type="button" onClick={handleOverride} disabled={isPending} className="mt-3 text-xs font-medium underline underline-offset-4">Save relationship</button></fieldset>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="size-4 accent-foreground" /> Publish after verification</label>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-5 py-4"><button onClick={() => setForm(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button><button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">{isPending && <Loader2 className="size-4 animate-spin" />}{form.id ? 'Save changes' : 'Create post'}</button></div>
      </div></div>}
    </>
  )
}
