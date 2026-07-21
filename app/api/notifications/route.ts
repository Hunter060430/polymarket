import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userNotification } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ notifications: [], unread: 0 })
  const notifications = await db.select().from(userNotification).where(eq(userNotification.userId, userId)).orderBy(desc(userNotification.createdAt)).limit(30)
  return NextResponse.json({ notifications, unread: notifications.filter((item) => !item.read).length })
}

export async function PATCH(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (body?.all === true) {
    await db.update(userNotification).set({ read: true }).where(eq(userNotification.userId, userId))
  } else if (Number.isInteger(body?.id)) {
    await db.update(userNotification).set({ read: true }).where(and(eq(userNotification.id, body.id), eq(userNotification.userId, userId)))
  }
  return NextResponse.json({ ok: true })
}
