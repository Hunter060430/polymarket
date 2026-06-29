// POST /api/pre-season/award
// Called client-side (e.g. after AI analysis) to award tasks that cannot be
// triggered server-side. All logic is delegated to pre-season-server helpers.

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { awardAiAnalysisTasks, grantOneTimeTask } from '@/lib/pre-season-server'
import { TASKS } from '@/lib/pre-season'

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

  // AI analysis triggers both the one-time milestones and repeatable bonus
  if (taskKey === 'run_ai_analysis') {
    await awardAiAnalysisTasks(userId)
  } else {
    await grantOneTimeTask(userId, taskKey)
  }

  return Response.json({ ok: true, taskKey })
}
