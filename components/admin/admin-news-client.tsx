'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createNewsPost, updateNewsPost, deleteNewsPost } from '@/app/actions/news'
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, X, Loader2 } from 'lucide-react'

type Post = {
  id: number
  slug: string
  title: string
  summary: string
  category: string
  published: boolean
  publishedAt: Date | null
  createdAt: Date
}

type FormState = {
  id?: number
  title: string
  summary: string
  body: string
  category: string
  published: boolean
}

const CATEGORIES = ['update', 'feature', 'analysis', 'announcement']
const CATEGORY_LABELS: Record<string, string> = {
  update: 'Update', feature: 'Feature', analysis: 'Analysis', announcement: 'Announcement',
}

const EMPTY_FORM: FormState = { title: '', summary: '', body: '', category: 'update', published: false }

function formatDate(date: Date | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export function AdminNewsClient({ posts: initialPosts, adminName }: { posts: Post[]; adminName: string }) {
  const [posts, setPosts] = useState(initialPosts)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openNew() {
    setForm({ ...EMPTY_FORM })
    setError(null)
  }

  function openEdit(post: Post & { body?: string }) {
    setForm({
      id:        post.id,
      title:     post.title,
      summary:   post.summary,
      body:      post.body ?? '',
      category:  post.category,
      published: post.published,
    })
    setError(null)
  }

  function handleSave() {
    if (!form) return
    if (!form.title.trim() || !form.summary.trim() || !form.body.trim()) {
      setError('Title, summary, and body are required.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        if (form.id) {
          await updateNewsPost(form.id, form)
          setPosts(prev => prev.map(p => p.id === form.id
            ? { ...p, title: form.title, summary: form.summary, category: form.category, published: form.published }
            : p
          ))
        } else {
          const result = await createNewsPost(form)
          setPosts(prev => [{
            id: Date.now(), slug: result.slug, title: form.title, summary: form.summary,
            category: form.category, published: form.published,
            publishedAt: form.published ? new Date() : null, createdAt: new Date(),
          }, ...prev])
        }
        setForm(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save.')
      }
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    startTransition(async () => {
      try {
        await deleteNewsPost(id)
        setPosts(prev => prev.filter(p => p.id !== id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← ver.watch
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">Admin — News</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{adminName}</span>
          <Link href="/news" target="_blank" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            View live <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-foreground">News Posts</h1>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-foreground text-background text-sm px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" aria-hidden="true" />
            New Post
          </button>
        </div>

        {error && !form && (
          <p className="text-xs text-destructive border-l-2 border-destructive pl-3 py-1 mb-4">{error}</p>
        )}

        {/* Posts table */}
        {posts.length === 0 ? (
          <div className="border border-border py-16 text-center text-sm text-muted-foreground">
            No posts yet. Create your first post.
          </div>
        ) : (
          <div className="border border-border divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start justify-between px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] tracking-wider uppercase border border-border px-1.5 py-0.5 text-muted-foreground">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                    {post.published ? (
                      <span className="text-[10px] tracking-wider uppercase text-emerald-600 flex items-center gap-1">
                        <Eye className="size-2.5" aria-hidden="true" /> Published {formatDate(post.publishedAt)}
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-wider uppercase text-muted-foreground flex items-center gap-1">
                        <EyeOff className="size-2.5" aria-hidden="true" /> Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.summary}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {post.published && (
                    <Link
                      href={`/news/${post.slug}`}
                      target="_blank"
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="View post"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                  <button
                    onClick={() => openEdit(post)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {form && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">
                {form.id ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={() => setForm(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {error && (
                <p className="text-xs text-destructive border-l-2 border-destructive pl-3 py-1">{error}</p>
              )}

              {/* Category + Published row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => f ? { ...f, category: e.target.value } : f)}
                    className="w-full border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="published"
                    checked={form.published}
                    onChange={e => setForm(f => f ? { ...f, published: e.target.checked } : f)}
                    className="size-4 accent-foreground"
                  />
                  <label htmlFor="published" className="text-sm text-foreground select-none">Publish now</label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                  placeholder="Post title…"
                  className="w-full border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Summary <span className="text-muted-foreground">(shown on list page)</span></label>
                <textarea
                  value={form.summary}
                  onChange={e => setForm(f => f ? { ...f, summary: e.target.value } : f)}
                  placeholder="One or two sentences describing this post…"
                  rows={2}
                  className="w-full border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Body</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => f ? { ...f, body: e.target.value } : f)}
                  placeholder="Full post content…"
                  rows={12}
                  className="w-full border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground placeholder:text-muted-foreground resize-y font-mono"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setForm(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-foreground text-background text-sm px-5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                {form.id ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
