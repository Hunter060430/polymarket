import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userFeedback } from '@/lib/db/schema'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const body = await request.json().catch(() => null)
  const category = typeof body?.category === 'string' ? body.category.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const pageUrl = typeof body?.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : null

  if (!['feedback', 'bug', 'data'].includes(category) || message.length < 10 || message.length > 4000) {
    return NextResponse.json({ error: 'Please provide a valid category and 10–4,000 character message.' }, { status: 400 })
  }

  await db.insert(userFeedback).values({
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    category,
    message,
    pageUrl,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
