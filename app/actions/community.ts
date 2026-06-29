'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { marketComment, commentVote, riskVote, user, userReputation } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { upsertReputation } from '@/lib/reputation'
import { awardCommentTasks, awardVoteTasks, awardUpvoteTasks } from '@/lib/pre-season-server'

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Key-free bot protection for free-text submissions.
//  - honeypot: a hidden field humans never see; bots auto-fill it.
//  - elapsedMs: time between form render and submit; humans take >1.5s.
const MIN_FILL_MS = 1500

export type BotCheck = { honeypot?: string; elapsedMs?: number }

function looksLikeBot(check?: BotCheck): boolean {
  if (!check) return false
  if (check.honeypot && check.honeypot.trim() !== '') return true
  if (typeof check.elapsedMs === 'number' && check.elapsedMs < MIN_FILL_MS) return true
  return false
}

export type CommentWithAuthor = {
  id: number
  marketId: string
  userId: string
  body: string
  upvotes: number
  createdAt: Date
  authorName: string | null
  authorImage: string | null
  authorBadge: string
  authorScore: number
  hasVoted: boolean
}

// --- Comments --------------------------------------------------------------

export async function getComments(marketId: string): Promise<CommentWithAuthor[]> {
  const session = await getSession()
  const viewerId = session?.user?.id ?? null

  const rows = await db
    .select({
      id: marketComment.id,
      marketId: marketComment.marketId,
      userId: marketComment.userId,
      body: marketComment.body,
      upvotes: marketComment.upvotes,
      createdAt: marketComment.createdAt,
      authorName: user.name,
      authorImage: user.image,
      votedId: commentVote.id,
      authorBadge: userReputation.badge,
      authorScore: userReputation.score,
    })
    .from(marketComment)
    .leftJoin(user, eq(marketComment.userId, user.id))
    .leftJoin(
      commentVote,
      and(
        eq(commentVote.commentId, marketComment.id),
        viewerId ? eq(commentVote.userId, viewerId) : sql`false`,
      ),
    )
    .leftJoin(userReputation, eq(marketComment.userId, userReputation.userId))
    .where(eq(marketComment.marketId, marketId))
    .orderBy(desc(marketComment.upvotes), desc(marketComment.createdAt))
    .limit(200)

  return rows.map((r) => ({
    id: r.id,
    marketId: r.marketId,
    userId: r.userId,
    body: r.body,
    upvotes: r.upvotes,
    createdAt: r.createdAt,
    authorName: r.authorName,
    authorImage: r.authorImage,
    authorBadge: r.authorBadge ?? 'Observer',
    authorScore: r.authorScore ?? 0,
    hasVoted: r.votedId !== null,
  }))
}

const RATE_WINDOW_MS = 60_000 // 1 minute
const MAX_COMMENTS_PER_WINDOW = 3

export async function postComment(
  marketId: string,
  body: string,
  botCheck?: BotCheck,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { ok: false, error: 'You must be signed in to comment.' }
  }

  // Silent bot rejection — return a generic error without revealing the trap.
  if (looksLikeBot(botCheck)) {
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  const trimmed = body.trim()
  if (trimmed.length < 2) return { ok: false, error: 'Comment is too short.' }
  if (trimmed.length > 2000) return { ok: false, error: 'Comment is too long (max 2000 chars).' }

  // Basic rate limit: max N comments per user per rolling window
  const since = new Date(Date.now() - RATE_WINDOW_MS)
  const recent = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(marketComment)
    .where(and(eq(marketComment.userId, userId), sql`${marketComment.createdAt} > ${since}`))

  if ((recent[0]?.count ?? 0) >= MAX_COMMENTS_PER_WINDOW) {
    return { ok: false, error: 'Slow down — you can post a few comments per minute.' }
  }

  await db.insert(marketComment).values({ marketId, userId, body: trimmed })
  void upsertReputation(userId, 'comment')
  void awardCommentTasks(userId)
  revalidatePath(`/markets/${marketId}`)
  return { ok: true }
}

export async function deleteComment(commentId: number, marketId: string) {
  const userId = await requireUserId()
  await db
    .delete(marketComment)
    .where(and(eq(marketComment.id, commentId), eq(marketComment.userId, userId)))
  revalidatePath(`/markets/${marketId}`)
}

export async function toggleCommentUpvote(commentId: number, marketId: string) {
  const userId = await requireUserId()

  const existing = await db
    .select({ id: commentVote.id })
    .from(commentVote)
    .where(and(eq(commentVote.commentId, commentId), eq(commentVote.userId, userId)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .delete(commentVote)
      .where(and(eq(commentVote.commentId, commentId), eq(commentVote.userId, userId)))
    await db
      .update(marketComment)
      .set({ upvotes: sql`greatest(${marketComment.upvotes} - 1, 0)` })
      .where(eq(marketComment.id, commentId))
  } else {
    await db.insert(commentVote).values({ commentId, userId })
    await db
      .update(marketComment)
      .set({ upvotes: sql`${marketComment.upvotes} + 1` })
      .where(eq(marketComment.id, commentId))

    // Award comment owner for receiving upvotes
    const [commented] = await db
      .select({ userId: marketComment.userId })
      .from(marketComment)
      .where(eq(marketComment.id, commentId))
    if (commented) void awardUpvoteTasks(commented.userId)
  }
  revalidatePath(`/markets/${marketId}`)
}

// --- Community risk votes ---------------------------------------------------

export type RiskTally = {
  low: number
  medium: number
  high: number
  critical: number
  total: number
  userVote: string | null
}

export async function getRiskTally(marketId: string): Promise<RiskTally> {
  const session = await getSession()
  const viewerId = session?.user?.id ?? null

  const rows = await db
    .select({ vote: riskVote.vote, count: sql<number>`count(*)::int` })
    .from(riskVote)
    .where(eq(riskVote.marketId, marketId))
    .groupBy(riskVote.vote)

  const tally: RiskTally = { low: 0, medium: 0, high: 0, critical: 0, total: 0, userVote: null }
  for (const r of rows) {
    if (r.vote === 'low') tally.low = r.count
    else if (r.vote === 'medium') tally.medium = r.count
    else if (r.vote === 'high') tally.high = r.count
    else if (r.vote === 'critical') tally.critical = r.count
    tally.total += r.count
  }

  if (viewerId) {
    const mine = await db
      .select({ vote: riskVote.vote })
      .from(riskVote)
      .where(and(eq(riskVote.marketId, marketId), eq(riskVote.userId, viewerId)))
      .limit(1)
    tally.userVote = mine[0]?.vote ?? null
  }

  return tally
}

// --- Trending (community engagement) ---------------------------------------

export type TrendingEntry = {
  marketId: string
  comments: number
  votes: number
  activity: number
}

// Returns market ids ranked by community engagement (comments + risk votes)
// over the trailing window. Used to power the homepage "Trending" section.
export async function getTrendingMarketIds(limit = 6): Promise<TrendingEntry[]> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) // 14 days

  const commentCounts = await db
    .select({ marketId: marketComment.marketId, n: sql<number>`count(*)::int` })
    .from(marketComment)
    .where(sql`${marketComment.createdAt} > ${since}`)
    .groupBy(marketComment.marketId)

  const voteCounts = await db
    .select({ marketId: riskVote.marketId, n: sql<number>`count(*)::int` })
    .from(riskVote)
    .where(sql`${riskVote.updatedAt} > ${since}`)
    .groupBy(riskVote.marketId)

  const map = new Map<string, TrendingEntry>()
  for (const c of commentCounts) {
    map.set(c.marketId, { marketId: c.marketId, comments: c.n, votes: 0, activity: 0 })
  }
  for (const v of voteCounts) {
    const e = map.get(v.marketId) ?? { marketId: v.marketId, comments: 0, votes: 0, activity: 0 }
    e.votes = v.n
    map.set(v.marketId, e)
  }

  return Array.from(map.values())
    .map((e) => ({ ...e, activity: e.comments * 2 + e.votes }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, limit)
}

export async function castRiskVote(
  marketId: string,
  vote: 'low' | 'medium' | 'high' | 'critical',
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { ok: false, error: 'You must be signed in to vote.' }
  }

  // Upsert: one vote per user per market, changeable
  await db
    .insert(riskVote)
    .values({ marketId, userId, vote })
    .onConflictDoUpdate({
      target: [riskVote.marketId, riskVote.userId],
      set: { vote, updatedAt: new Date() },
    })

  void upsertReputation(userId, 'vote')
  void awardVoteTasks(userId)
  revalidatePath(`/markets/${marketId}`)
  return { ok: true }
}
