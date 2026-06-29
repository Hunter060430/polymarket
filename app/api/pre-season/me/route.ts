// GET /api/pre-season/me
// Returns the current user's points, completed tasks, badge eligibility,
// and their rank on the leaderboard.

import { db } from '@/lib/db'
import { preSeasonPoints, preSeasonTaskCompletions, user } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { TASKS, GENESIS_BADGES, getBadgeEligibility } from '@/lib/pre-season'
import { eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { awardDailyCheckin } from '@/lib/pre-season-server'
import { grantOneTimeTask } from '@/lib/pre-season-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Auto-award onboarding tasks + daily check-in
  await grantOneTimeTask(userId, 'first_sign_in')
  const [userRow] = await db.select({ username: user.username }).from(user).where(eq(user.id, userId))
  if (userRow?.username) await grantOneTimeTask(userId, 'complete_profile')
  await awardDailyCheckin(userId)

  // Points row
  const [pointsRow] = await db
    .select()
    .from(preSeasonPoints)
    .where(eq(preSeasonPoints.userId, userId))

  const points = pointsRow?.points ?? 0

  // Completed tasks
  const completions = await db
    .select()
    .from(preSeasonTaskCompletions)
    .where(eq(preSeasonTaskCompletions.userId, userId))

  const completedKeys = completions.map(c => c.taskKey)

  // Rank — count users with more points
  const [{ rank }] = await db
    .select({ rank: sql<number>`COUNT(*) + 1` })
    .from(preSeasonPoints)
    .where(sql`${preSeasonPoints.points} > ${points}`)

  // Registration rank (position by createdAt)
  const [{ regRank }] = await db
    .select({ regRank: sql<number>`(SELECT COUNT(*) FROM "user" u2 WHERE u2."createdAt" <= u."createdAt") ` })
    .from(user)
    .where(eq(user.id, userId))

  const eligibleBadges = getBadgeEligibility(points, completedKeys, Number(regRank))

  // Count completions per task key (needed for repeatable tasks)
  const completionCounts: Record<string, number> = {}
  for (const c of completions) {
    completionCounts[c.taskKey] = (completionCounts[c.taskKey] ?? 0) + 1
  }

  // Task progress with definition merged in
  const taskProgress = TASKS.map(task => ({
    ...task,
    completed: !task.repeatable && completedKeys.includes(task.key),
    completionCount: completionCounts[task.key] ?? 0,
  }))

  return Response.json({
    points,
    rank: Number(rank),
    completedKeys,
    taskProgress,
    eligibleBadges,
  })
}
