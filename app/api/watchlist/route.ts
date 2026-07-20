import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { watchlistItem } from '@/lib/db/schema'
import { fetchMarketById } from '@/lib/polymarket'

async function getUserId(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user?.id ?? null
}

export async function GET(request: Request) {
  const userId = await getUserId(request)
  if (!userId) return NextResponse.json({ ids: [] }, { status: 401 })
  const rows = await db.select({ marketId: watchlistItem.marketId }).from(watchlistItem)
    .where(eq(watchlistItem.userId, userId))
  return NextResponse.json({ ids: rows.map((row) => row.marketId) })
}

export async function POST(request: Request) {
  const userId = await getUserId(request)
  if (!userId) return NextResponse.json({ error: 'Sign in to sync your watchlist.' }, { status: 401 })
  const body = await request.json() as { marketId?: string; question?: string; price?: number; score?: number; endDate?: string }
  if (!body.marketId) return NextResponse.json({ error: 'Market ID is required.' }, { status: 400 })
  const market = await fetchMarketById(body.marketId)
  const baselinePrice = Number.isFinite(body.price) ? body.price! : market?.outcomePrices[0] ?? null
  const baselineScore = Number.isFinite(body.score) ? body.score! : market?.score.totalScore ?? null
  const endDate = body.endDate ? new Date(body.endDate) : market?.endDate ? new Date(market.endDate) : null
  await db.insert(watchlistItem).values({
    userId,
    marketId: body.marketId,
    marketQuestion: body.question?.trim() || market?.question || `Polymarket market ${body.marketId}`,
    baselinePrice,
    baselineScore,
    marketEndDate: endDate,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [watchlistItem.userId, watchlistItem.marketId],
    set: { updatedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const userId = await getUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const marketId = new URL(request.url).searchParams.get('marketId')
  if (!marketId) return NextResponse.json({ error: 'Market ID is required.' }, { status: 400 })
  await db.delete(watchlistItem).where(and(eq(watchlistItem.userId, userId), eq(watchlistItem.marketId, marketId)))
  return NextResponse.json({ ok: true })
}
