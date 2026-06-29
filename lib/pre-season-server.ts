// Server-side helper for awarding Pre-Season points.
// Safe to call from Server Actions and API routes — never throws.

import { db } from '@/lib/db'
import { preSeasonPoints, preSeasonTaskCompletions, marketComment, riskVote } from '@/lib/db/schema'
import { TASKS } from '@/lib/pre-season'
import { and, eq, sql, count } from 'drizzle-orm'

async function isAlreadyCompleted(userId: string, taskKey: string): Promise<boolean> {
  const rows = await db
    .select({ id: preSeasonTaskCompletions.id })
    .from(preSeasonTaskCompletions)
    .where(and(
      eq(preSeasonTaskCompletions.userId, userId),
      eq(preSeasonTaskCompletions.taskKey, taskKey),
    ))
  return rows.length > 0
}

async function grantTask(userId: string, taskKey: string): Promise<void> {
  const task = TASKS.find(t => t.key === taskKey)
  if (!task) return

  if (!task.repeatable && await isAlreadyCompleted(userId, taskKey)) return

  await db
    .insert(preSeasonTaskCompletions)
    .values({ userId, taskKey })
    .onConflictDoNothing()

  await db
    .insert(preSeasonPoints)
    .values({ userId, points: task.points })
    .onConflictDoUpdate({
      target: preSeasonPoints.userId,
      set: {
        points: sql`${preSeasonPoints.points} + ${task.points}`,
        updatedAt: new Date(),
      },
    })
}

// Called after a successful comment post
export async function awardCommentTasks(userId: string): Promise<void> {
  try {
    // first_comment — one-time
    await grantTask(userId, 'first_comment')

    // comments_10 — check total comment count
    const [{ n }] = await db
      .select({ n: count() })
      .from(marketComment)
      .where(eq(marketComment.userId, userId))
    if (Number(n) >= 10) await grantTask(userId, 'comments_10')
  } catch { /* silent */ }
}

// Called after a successful risk vote
export async function awardVoteTasks(userId: string): Promise<void> {
  try {
    // first_risk_vote — one-time
    await grantTask(userId, 'first_risk_vote')

    // risk_votes_10 — check total vote count
    const [{ n }] = await db
      .select({ n: count() })
      .from(riskVote)
      .where(eq(riskVote.userId, userId))
    if (Number(n) >= 10) await grantTask(userId, 'risk_votes_10')
    if (Number(n) >= 50) await grantTask(userId, 'risk_votes_50')
  } catch { /* silent */ }
}

// Called after AI analysis completes (from API route)
export async function awardAiAnalysisTasks(userId: string, totalRuns: number): Promise<void> {
  try {
    await grantTask(userId, 'run_ai_analysis')
    if (totalRuns >= 5) await grantTask(userId, 'ai_analysis_5')
  } catch { /* silent */ }
}

// Called after upvote — check if comment owner now has upvoted comments
export async function awardUpvoteTasks(commentOwnerId: string): Promise<void> {
  try {
    const rows = await db
      .select({ upvotes: marketComment.upvotes })
      .from(marketComment)
      .where(eq(marketComment.userId, commentOwnerId))
    const hasAny = rows.some(r => r.upvotes >= 1)
    const hasThree = rows.some(r => r.upvotes >= 3)
    if (hasAny)   await grantTask(commentOwnerId, 'comment_upvoted')
    if (hasThree) await grantTask(commentOwnerId, 'comment_3_upvotes')
  } catch { /* silent */ }
}
