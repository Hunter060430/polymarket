// POST /api/pre-season/award
// Internal route — called by server actions when a user completes a task.
// Awards points and records the task completion atomically.

import { db } from '@/lib/db'
import { preSeasonPoints, preSeasonTaskCompletions } from '@/lib/db/schema'
import { TASKS } from '@/lib/pre-season'
import { auth } from '@/lib/auth'
import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskKey } = await req.json() as { taskKey?: string }
  if (!taskKey) return Response.json({ error: 'Missing taskKey' }, { status: 400 })

  const task = TASKS.find(t => t.key === taskKey)
  if (!task) return Response.json({ error: 'Unknown task' }, { status: 400 })

  const userId = session.user.id

  // Check if already completed (for non-repeatable tasks)
  if (!task.repeatable) {
    const existing = await db
      .select({ id: preSeasonTaskCompletions.id })
      .from(preSeasonTaskCompletions)
      .where(and(
        eq(preSeasonTaskCompletions.userId, userId),
        eq(preSeasonTaskCompletions.taskKey, taskKey),
      ))

    if (existing.length > 0) {
      return Response.json({ alreadyAwarded: true, points: 0 })
    }
  }

  // Record completion
  await db.insert(preSeasonTaskCompletions).values({
    userId,
    taskKey,
  }).onConflictDoNothing()

  // Upsert points
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

  return Response.json({ awarded: true, points: task.points, taskKey })
}
