'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, account, marketComment, riskVote, userReputation } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type AccountData = {
  id: string
  name: string
  username: string | null
  email: string
  image: string | null
  createdAt: Date
  providers: string[]
  recentComments: { id: number; marketId: string; body: string; createdAt: Date }[]
  recentVotes: { id: number; marketId: string; vote: string; createdAt: Date }[]
  reputation: { badge: string; score: number; commentCount: number; voteCount: number } | null
}

export async function getAccountData(): Promise<AccountData | null> {
  const session = await getSession()
  if (!session?.user) return null
  const userId = session.user.id

  const [userData, accounts, comments, votes, rep] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1),
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, userId)),
    db
      .select({ id: marketComment.id, marketId: marketComment.marketId, body: marketComment.body, createdAt: marketComment.createdAt })
      .from(marketComment)
      .where(eq(marketComment.userId, userId))
      .orderBy(desc(marketComment.createdAt))
      .limit(10),
    db
      .select({ id: riskVote.id, marketId: riskVote.marketId, vote: riskVote.vote, createdAt: riskVote.createdAt })
      .from(riskVote)
      .where(eq(riskVote.userId, userId))
      .orderBy(desc(riskVote.createdAt))
      .limit(10),
    db.select().from(userReputation).where(eq(userReputation.userId, userId)).limit(1),
  ])

  if (!userData[0]) return null

  return {
    ...userData[0],
    providers: accounts.map((a) => a.providerId),
    recentComments: comments,
    recentVotes: votes,
    reputation: rep[0]
      ? { badge: rep[0].badge, score: rep[0].score, commentCount: rep[0].commentCount, voteCount: rep[0].voteCount }
      : null,
  }
}

export async function updateDisplayName(
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { ok: false, error: 'You must be signed in.' }
  }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { ok: false, error: 'Username must be at least 2 characters.' }
  if (trimmed.length > 30) return { ok: false, error: 'Username must be 30 characters or less.' }
  if (!/^[a-zA-Z0-9_.\-]+$/.test(trimmed))
    return { ok: false, error: 'Only letters, numbers, underscores, dots, and hyphens allowed.' }

  // Check uniqueness — exclude current user
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, trimmed))
    .limit(1)

  if (existing.length > 0 && existing[0].id !== userId) {
    return { ok: false, error: 'That username is already taken.' }
  }

  await db.update(user).set({ username: trimmed, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/account')
  return { ok: true }
}
