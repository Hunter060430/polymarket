'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { marketComment, commentVote, riskVote, user, userReputation } from '@/lib/db/schema'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath, unstable_cache, updateTag } from 'next/cache'
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

const COMMUNITY_CACHE_SECONDS = 300
const communityTag = (marketId: string) => `community:${marketId}`

type PublicComment = Omit<CommentWithAuthor, 'hasVoted'>

const loadPublicComments = unstable_cache(
  async (marketId: string): Promise<PublicComment[]> => {
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
        authorBadge: userReputation.badge,
        authorScore: userReputation.score,
      })
      .from(marketComment)
      .leftJoin(user, eq(marketComment.userId, user.id))
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
    }))
  },
  ['community:comments'],
  { revalidate: COMMUNITY_CACHE_SECONDS },
)

// Public pages must keep rendering when the database is unavailable (e.g. quota exceeded).
async function orFallback<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.error(`[community] ${label} failed, serving fallback:`, error instanceof Error ? error.message : error)
    return fallback
  }
}

export async function getComments(marketId: string): Promise<CommentWithAuthor[]> {
  return orFallback('comments', () => readComments(marketId), [])
}

async function readComments(marketId: string): Promise<CommentWithAuthor[]> {
  const [cached, session] = await Promise.all([loadPublicComments(marketId), getSession()])
  // unstable_cache round-trips through JSON, so createdAt arrives as a string.
  const comments = cached.map((comment) => ({ ...comment, createdAt: new Date(comment.createdAt) }))
  const viewerId = session?.user?.id

  if (!viewerId || comments.length === 0) {
    return comments.map((comment) => ({ ...comment, hasVoted: false }))
  }

  const voted = await db
    .select({ commentId: commentVote.commentId })
    .from(commentVote)
    .where(and(eq(commentVote.userId, viewerId), inArray(commentVote.commentId, comments.map((comment) => comment.id))))
  const votedIds = new Set(voted.map((row) => row.commentId))

  return comments.map((comment) => ({ ...comment, hasVoted: votedIds.has(comment.id) }))
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
  updateTag(communityTag(marketId))
  return { ok: true }
}

export async function deleteComment(commentId: number, marketId: string) {
  const userId = await requireUserId()
  await db
    .delete(marketComment)
    .where(and(eq(marketComment.id, commentId), eq(marketComment.userId, userId)))
  revalidatePath(`/markets/${marketId}`)
  updateTag(communityTag(marketId))
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
  updateTag(communityTag(marketId))
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

const loadPublicTally = unstable_cache(
  async (marketId: string): Promise<RiskTally> => {
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
    return tally
  },
  ['community:risk-tally'],
  { revalidate: COMMUNITY_CACHE_SECONDS },
)

export async function getRiskTally(marketId: string): Promise<RiskTally> {
  return orFallback(
    'risk tally',
    () => readRiskTally(marketId),
    { low: 0, medium: 0, high: 0, critical: 0, total: 0, userVote: null },
  )
}

async function readRiskTally(marketId: string): Promise<RiskTally> {
  const [tally, session] = await Promise.all([loadPublicTally(marketId), getSession()])
  const viewerId = session?.user?.id
  if (!viewerId) return { ...tally, userVote: null }

  const mine = await db
    .select({ vote: riskVote.vote })
    .from(riskVote)
    .where(and(eq(riskVote.marketId, marketId), eq(riskVote.userId, viewerId)))
    .limit(1)
  return { ...tally, userVote: mine[0]?.vote ?? null }
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
const loadTrendingMarketIds = unstable_cache(
  async (limit: number): Promise<TrendingEntry[]> => {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) // 14 days

    const [commentCounts, voteCounts] = await Promise.all([
      db
        .select({ marketId: marketComment.marketId, n: sql<number>`count(*)::int` })
        .from(marketComment)
        .where(sql`${marketComment.createdAt} > ${since}`)
        .groupBy(marketComment.marketId),
      db
        .select({ marketId: riskVote.marketId, n: sql<number>`count(*)::int` })
        .from(riskVote)
        .where(sql`${riskVote.updatedAt} > ${since}`)
        .groupBy(riskVote.marketId),
    ])

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
  },
  ['community:trending'],
  { revalidate: 15 * 60 },
)

export async function getTrendingMarketIds(limit = 6): Promise<TrendingEntry[]> {
  return orFallback('trending', () => loadTrendingMarketIds(limit), [])
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
  updateTag(communityTag(marketId))
  return { ok: true }
}
