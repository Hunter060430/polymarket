// GET /api/pre-season/leaderboard
// Returns top-100 ranked users by Pre-Season points.

import { db } from '@/lib/db'
import { preSeasonPoints } from '@/lib/db/schema'
import { user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await db
    .select({
      userId:    preSeasonPoints.userId,
      points:    preSeasonPoints.points,
      updatedAt: preSeasonPoints.updatedAt,
      name:      user.name,
      username:  user.username,
      image:     user.image,
    })
    .from(preSeasonPoints)
    .innerJoin(user, eq(preSeasonPoints.userId, user.id))
    .orderBy(desc(preSeasonPoints.points))
    .limit(100)

  return Response.json({
    leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r })),
    total: rows.length,
  })
}
