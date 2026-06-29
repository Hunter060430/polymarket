// Server-side helper for awarding Pre-Season points.
// Safe to call from Server Actions and API routes — never throws.

import { db } from '@/lib/db'
import {
  preSeasonPoints,
  preSeasonTaskCompletions,
  preSeasonDailyCheckins,
  marketComment,
  riskVote,
} from '@/lib/db/schema'
import { TASKS } from '@/lib/pre-season'
import { and, eq, sql, count, gte } from 'drizzle-orm'

// ── Core helpers ──────────────────────────────────────────────────────────────

async function getCompletionCount(userId: string, taskKey: string): Promise<number> {
  const rows = await db
    .select({ id: preSeasonTaskCompletions.id })
    .from(preSeasonTaskCompletions)
    .where(and(
      eq(preSeasonTaskCompletions.userId, userId),
      eq(preSeasonTaskCompletions.taskKey, taskKey),
    ))
  return rows.length
}

async function addPoints(userId: string, points: number): Promise<void> {
  await db
    .insert(preSeasonPoints)
    .values({ userId, points })
    .onConflictDoUpdate({
      target: preSeasonPoints.userId,
      set: {
        points: sql`${preSeasonPoints.points} + ${points}`,
        updatedAt: new Date(),
      },
    })
}

// Exported alias for one-time grants called from API routes directly
export async function grantOneTimeTask(userId: string, taskKey: string): Promise<void> {
  return grantTask(userId, taskKey)
}

async function grantTask(userId: string, taskKey: string): Promise<void> {
  const task = TASKS.find(t => t.key === taskKey)
  if (!task) return

  const currentCount = await getCompletionCount(userId, taskKey)

  // One-time tasks: skip if already done
  if (!task.repeatable && currentCount > 0) return

  // Repeatable tasks: skip if at cap
  if (task.repeatable && task.maxCount && currentCount >= task.maxCount) return

  await db
    .insert(preSeasonTaskCompletions)
    .values({ userId, taskKey })
    .onConflictDoNothing()  // safety: one-time tasks have a DB unique constraint

  await addPoints(userId, task.points)
}

// ── Public award functions ─────────────────────────────────────────────────────

// Called after a successful comment post
export async function awardCommentTasks(userId: string): Promise<void> {
  try {
    const [{ n }] = await db
      .select({ n: count() })
      .from(marketComment)
      .where(eq(marketComment.userId, userId))
    const total = Number(n)

    await grantTask(userId, 'first_comment')
    if (total >= 10)  await grantTask(userId, 'comments_10')
    if (total >= 50)  await grantTask(userId, 'comments_50')

    // Repeatable: +10 per comment, up to 100 times
    await grantTask(userId, 'comment_daily')
  } catch { /* silent */ }
}

// Called after a successful risk vote
export async function awardVoteTasks(userId: string): Promise<void> {
  try {
    const [{ n }] = await db
      .select({ n: count() })
      .from(riskVote)
      .where(eq(riskVote.userId, userId))
    const total = Number(n)

    await grantTask(userId, 'first_risk_vote')
    if (total >= 10)  await grantTask(userId, 'risk_votes_10')
    if (total >= 50)  await grantTask(userId, 'risk_votes_50')
    if (total >= 100) await grantTask(userId, 'risk_votes_100')

    // Repeatable: +5 per vote, up to 200 times
    await grantTask(userId, 'vote_daily')
  } catch { /* silent */ }
}

// Called after AI analysis completes (client-side via /api/pre-season/award)
export async function awardAiAnalysisTasks(userId: string): Promise<void> {
  try {
    const aiCount = await getCompletionCount(userId, 'ai_daily')
    const totalRuns = aiCount + 1  // current run not yet recorded

    await grantTask(userId, 'run_ai_analysis')
    if (totalRuns >= 5)  await grantTask(userId, 'ai_analysis_5')
    if (totalRuns >= 20) await grantTask(userId, 'ai_analysis_20')

    // Repeatable: +15 per AI run, up to 50 times
    await grantTask(userId, 'ai_daily')
  } catch { /* silent */ }
}

// Called after upvote — rewards the comment owner
export async function awardUpvoteTasks(commentOwnerId: string): Promise<void> {
  try {
    const rows = await db
      .select({ upvotes: marketComment.upvotes })
      .from(marketComment)
      .where(eq(marketComment.userId, commentOwnerId))
    const hasAny   = rows.some(r => r.upvotes >= 1)
    const hasThree = rows.some(r => r.upvotes >= 3)
    if (hasAny)   await grantTask(commentOwnerId, 'comment_upvoted')
    if (hasThree) await grantTask(commentOwnerId, 'comment_3_upvotes')
  } catch { /* silent */ }
}

// Called on /api/pre-season/me load — awards daily check-in and streak bonuses
export async function awardDailyCheckin(userId: string): Promise<void> {
  try {
    const todayUtc = new Date().toISOString().slice(0, 10)  // 'YYYY-MM-DD'

    // Insert today's check-in; skip if already done today
    const inserted = await db
      .insert(preSeasonDailyCheckins)
      .values({ userId, checkedInDate: todayUtc })
      .onConflictDoNothing()
      .returning({ id: preSeasonDailyCheckins.id })

    if (inserted.length === 0) return  // already checked in today

    // Award +10 for the daily check-in (up to 90 days)
    await grantTask(userId, 'daily_checkin')

    // Check consecutive streak: count days in last N days where check-in exists
    const sevenDaysAgo  = new Date(Date.now() - 6  * 86400000).toISOString().slice(0, 10)
    const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)

    const [{ streak7 }] = await db
      .select({ streak7: count() })
      .from(preSeasonDailyCheckins)
      .where(and(
        eq(preSeasonDailyCheckins.userId, userId),
        gte(preSeasonDailyCheckins.checkedInDate, sevenDaysAgo),
      ))
    const [{ streak30 }] = await db
      .select({ streak30: count() })
      .from(preSeasonDailyCheckins)
      .where(and(
        eq(preSeasonDailyCheckins.userId, userId),
        gte(preSeasonDailyCheckins.checkedInDate, thirtyDaysAgo),
      ))

    if (Number(streak7)  >= 7)  await grantTask(userId, 'streak_7')
    if (Number(streak30) >= 30) await grantTask(userId, 'streak_30')
  } catch { /* silent */ }
}
