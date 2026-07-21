'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  user,
  session,
  userFeedback,
  userReputation,
  marketComment,
  riskVote,
} from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session_ = await auth.api.getSession({ headers: await headers() })
  if (!session_?.user) throw new Error('Unauthorized')
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session_.user.id)).limit(1)
  if (!u || u.role !== 'admin') throw new Error('Forbidden')
  return session_.user
}

// --- Users -----------------------------------------------------------------

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  username: string | null
  image: string | null
  createdAt: Date
  commentCount: number
  voteCount: number
  score: number
  badge: string
  sessionCount: number
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireAdmin()

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      image: user.image,
      createdAt: user.createdAt,
      commentCount: userReputation.commentCount,
      voteCount: userReputation.voteCount,
      score: userReputation.score,
      badge: userReputation.badge,
    })
    .from(user)
    .leftJoin(userReputation, eq(user.id, userReputation.userId))
    .orderBy(desc(user.createdAt))
    .limit(500)

  // Count active sessions per user
  const sessionCounts = await db
    .select({ userId: session.userId, n: sql<number>`count(*)::int` })
    .from(session)
    .where(sql`${session.expiresAt} > now()`)
    .groupBy(session.userId)

  const sessionMap = new Map(sessionCounts.map((s) => [s.userId, s.n]))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    username: r.username,
    image: r.image,
    createdAt: r.createdAt,
    commentCount: r.commentCount ?? 0,
    voteCount: r.voteCount ?? 0,
    score: r.score ?? 0,
    badge: r.badge ?? 'Observer',
    sessionCount: sessionMap.get(r.id) ?? 0,
  }))
}

export async function setUserRole(userId: string, role: 'user' | 'admin') {
  await requireAdmin()
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/admin/users')
}

export async function getUserActivity(userId: string) {
  await requireAdmin()

  const [comments, votes] = await Promise.all([
    db
      .select({
        id: marketComment.id,
        marketId: marketComment.marketId,
        body: marketComment.body,
        upvotes: marketComment.upvotes,
        createdAt: marketComment.createdAt,
      })
      .from(marketComment)
      .where(eq(marketComment.userId, userId))
      .orderBy(desc(marketComment.createdAt))
      .limit(20),
    db
      .select({
        marketId: riskVote.marketId,
        vote: riskVote.vote,
        createdAt: riskVote.createdAt,
      })
      .from(riskVote)
      .where(eq(riskVote.userId, userId))
      .orderBy(desc(riskVote.createdAt))
      .limit(20),
  ])

  return { comments, votes }
}

// --- Feedback --------------------------------------------------------------

export type AdminFeedback = {
  id: number
  userId: string | null
  email: string | null
  category: string
  message: string
  pageUrl: string | null
  status: string
  createdAt: Date
  userName: string | null
}

export async function getAdminFeedback(): Promise<AdminFeedback[]> {
  await requireAdmin()

  const rows = await db
    .select({
      id: userFeedback.id,
      userId: userFeedback.userId,
      email: userFeedback.email,
      category: userFeedback.category,
      message: userFeedback.message,
      pageUrl: userFeedback.pageUrl,
      status: userFeedback.status,
      createdAt: userFeedback.createdAt,
      userName: user.name,
    })
    .from(userFeedback)
    .leftJoin(user, eq(userFeedback.userId, user.id))
    .orderBy(desc(userFeedback.createdAt))
    .limit(500)

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    email: r.email ?? r.userName ?? null,
    category: r.category,
    message: r.message,
    pageUrl: r.pageUrl,
    status: r.status,
    createdAt: r.createdAt,
    userName: r.userName,
  }))
}

export async function setFeedbackStatus(id: number, status: 'open' | 'in-progress' | 'resolved' | 'dismissed') {
  await requireAdmin()
  await db.update(userFeedback).set({ status }).where(eq(userFeedback.id, id))
  revalidatePath('/admin/feedback')
}

export async function getAdminStats() {
  await requireAdmin()

  const [userCount, feedbackCounts, commentCount] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(user),
    db
      .select({ status: userFeedback.status, n: sql<number>`count(*)::int` })
      .from(userFeedback)
      .groupBy(userFeedback.status),
    db.select({ n: sql<number>`count(*)::int` }).from(marketComment),
  ])

  const feedbackMap = new Map(feedbackCounts.map((f) => [f.status, f.n]))

  return {
    totalUsers: userCount[0]?.n ?? 0,
    totalComments: commentCount[0]?.n ?? 0,
    openFeedback: feedbackMap.get('open') ?? 0,
    inProgressFeedback: feedbackMap.get('in-progress') ?? 0,
    resolvedFeedback: feedbackMap.get('resolved') ?? 0,
  }
}
