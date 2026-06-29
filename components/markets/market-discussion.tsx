'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import {
  postComment,
  deleteComment,
  toggleCommentUpvote,
  type CommentWithAuthor,
} from '@/app/actions/community'
import { MessageSquare, ArrowBigUp, Trash2, Loader2 } from 'lucide-react'
import { ReputationBadge } from '@/components/reputation-badge'
import { awardTask } from '@/lib/pre-season-award'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function MarketDiscussion({
  marketId,
  initialComments,
}: {
  marketId: string
  initialComments: CommentWithAuthor[]
}) {
  const { data: session } = useSession()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Bot protection: hidden honeypot + time-to-submit. Neither is visible to users.
  const [honeypot, setHoneypot] = useState('')
  const composerMountedAt = useRef(Date.now())

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = body.trim()
    if (trimmed.length < 2) {
      setError('Comment is too short.')
      return
    }
    const elapsedMs = Date.now() - composerMountedAt.current
    startTransition(async () => {
      const res = await postComment(marketId, trimmed, { honeypot, elapsedMs })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setBody('')
      setHoneypot('')
      // Award pre-season points (idempotent server-side)
      awardTask('first_comment')
      // Optimistically prepend
          setComments((prev) => [
        {
          id: Date.now(),
          marketId,
          userId: session!.user.id,
          body: trimmed,
          upvotes: 0,
          createdAt: new Date(),
          authorName: session!.user.name || null,
          authorImage: session!.user.image || null,
          authorBadge: 'Observer',
          authorScore: 0,
          hasVoted: false,
        },
        ...prev,
      ])
    })
  }

  function upvote(id: number) {
    if (!session?.user) return
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, hasVoted: !c.hasVoted, upvotes: c.upvotes + (c.hasVoted ? -1 : 1) }
          : c,
      ),
    )
    startTransition(() => toggleCommentUpvote(id, marketId))
  }

  function remove(id: number) {
    setComments((prev) => prev.filter((c) => c.id !== id))
    startTransition(() => deleteComment(id, marketId))
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-heading text-2xl font-light text-foreground">Discussion</h2>
      </div>
      <p className="text-xs tracking-wide text-muted-foreground mb-6 uppercase">
        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </p>

      {/* Composer */}
      {session?.user ? (
        <form onSubmit={submit} className="mb-8">
          {/* Honeypot — hidden from humans, bots tend to fill it. Do not remove. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website-url-hp">Leave this field empty</label>
            <input
              id="website-url-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your read on this market's resolution rules…"
            rows={3}
            maxLength={2000}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-y"
          />
          <div className="flex items-center justify-between mt-2">
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <span className="text-xs text-muted-foreground">{body.length}/2000</span>
            )}
            <button
              type="submit"
              disabled={isPending || body.trim().length < 2}
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Post
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground border border-border px-4 py-3 mb-8">
          <Link href="/sign-in" className="text-primary hover:underline underline-offset-4">Sign in</Link>{' '}
          to join the discussion.
        </p>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No comments yet. Be the first to weigh in.</p>
      ) : (
        <ul className="flex flex-col">
          {comments.map((c) => {
            const isOwner = session?.user?.id === c.userId
            const display = c.authorName || 'Anonymous'
            const initial = display.charAt(0).toUpperCase()
            return (
              <li key={c.id} className="flex gap-3 py-4 border-b border-border">
                {/* Upvote */}
                <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
                  <button
                    onClick={() => upvote(c.id)}
                    disabled={!session?.user}
                    className="text-muted-foreground hover:text-primary transition-colors disabled:hover:text-muted-foreground disabled:opacity-40"
                    style={{ color: c.hasVoted ? 'var(--primary)' : undefined }}
                    aria-label="Upvote comment"
                    aria-pressed={c.hasVoted}
                  >
                    <ArrowBigUp className="size-5" fill={c.hasVoted ? 'currentColor' : 'none'} />
                  </button>
                  <span className="text-xs tabular-nums text-muted-foreground">{c.upvotes}</span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {c.authorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.authorImage || "/placeholder.svg"} alt="" className="size-5 rounded-full object-cover" />
                    ) : (
                      <span className="size-5 rounded-full bg-secondary text-foreground text-[10px] flex items-center justify-center font-medium">
                        {initial}
                      </span>
                    )}
                    <span className="text-sm font-medium text-foreground">{display}</span>
                    <ReputationBadge badge={c.authorBadge} score={c.authorScore} />
                    <span className="text-xs text-muted-foreground">· {timeAgo(c.createdAt)}</span>
                    {isOwner && (
                      <button
                        onClick={() => remove(c.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
