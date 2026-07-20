import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userNotification, watchlistItem } from '@/lib/db/schema'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const items = await db.select().from(watchlistItem).where(eq(watchlistItem.userId, userId))
  if (items.length === 0) return NextResponse.json({ created: 0 })

  const marketMap = new Map((await fetchAllActivePolymarketMarkets()).map((market) => [market.marketId, market]))
  const day = new Date().toISOString().slice(0, 10)
  let created = 0

  for (const item of items) {
    const market = marketMap.get(item.marketId)
    if (!market) continue
    const currentPrice = market.outcomePrices[0] ?? 0
    const alerts: Array<{ type: string; title: string; message: string }> = []
    if (item.baselinePrice != null && Math.abs(currentPrice - item.baselinePrice) >= 0.1) alerts.push({ type: 'price', title: 'Price moved 10+ points', message: `${market.question} is now ${(currentPrice * 100).toFixed(0)}%.` })
    if (item.baselineScore != null && Math.abs(market.score.totalScore - item.baselineScore) >= 10) alerts.push({ type: 'score', title: 'Clarity score changed', message: `${market.question} now scores ${market.score.totalScore}/100.` })
    const hoursRemaining = market.endDate ? (new Date(market.endDate).getTime() - Date.now()) / 3_600_000 : Infinity
    if (hoursRemaining > 0 && hoursRemaining <= 72) alerts.push({ type: 'resolution', title: 'Market resolves soon', message: `${market.question} is scheduled to end within ${Math.ceil(hoursRemaining)} hours.` })

    for (const alert of alerts) {
      const result = await db.insert(userNotification).values({ userId, marketId: market.marketId, ...alert, dedupeKey: `${userId}:${market.marketId}:${alert.type}:${day}` }).onConflictDoNothing().returning({ id: userNotification.id })
      created += result.length
    }
    await db.update(watchlistItem).set({ baselinePrice: currentPrice, baselineScore: market.score.totalScore, marketEndDate: market.endDate ? new Date(market.endDate) : null, updatedAt: new Date() }).where(eq(watchlistItem.id, item.id))
  }
  return NextResponse.json({ created })
}
