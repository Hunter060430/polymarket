// GET /api/pre-season/me
// Returns the current user's points, completed tasks, badge eligibility,
// and their rank on the leaderboard.

import { db } from '@/lib/db'
import { preSeasonPoints, preSeasonTaskCompletions, user } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { TASKS, GENESIS_BADGES, getBadgeEligibility } from '@/lib/pre-season'
import { and, eq, desc, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Auto-award one-time onboarding tasks silently
  async function autoAward(taskKey: string, pointsAmt: number) {
    try {
      const already = await db
        .select()
        .from(preSeasonTaskCompletions)
        .where(and(
          eq(preSeasonTaskCompletions.userId, userId),
          eq(preSeasonTaskCompletions.taskKey, taskKey),
        ))
      if (already.length > 0) return
      await db.insert(preSeasonTaskCompletions).values({ userId, taskKey }).onConflictDoNothing()
      await db
        .insert(preSeasonPoints)
        .values({ userId, points: pointsAmt })
        .onConflictDoUpdate({
          target: preSeasonPoints.userId,
          set: { points: sql`${preSeasonPoints.points} + ${pointsAmt}`, updatedAt: new Date() },
        })
    } catch { /* silent */ }
  }

  // first_sign_in — awarded on every GET /me hit when not yet completed
  await autoAward('first_sign_in', 20)
  // complete_profile — awarded if the user has set a username (query DB directly
  // since Better Auth doesn't expose custom fields in the session object)
  const [userRow] = await db.select({ username: user.username }).from(user).where(eq(user.id, userId))
  if (userRow?.username) {
    await autoAward('complete_profile', 50)
  }

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

  // Task progress with definition merged in
  const taskProgress = TASKS.map(task => ({
    ...task,
    completed: completedKeys.includes(task.key),
  }))

  return Response.json({
    points,
    rank: Number(rank),
    completedKeys,
    taskProgress,
    eligibleBadges,
  })
}
