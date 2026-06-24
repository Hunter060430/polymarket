'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, account, walletAddress, marketComment, riskVote } from '@/lib/db/schema'
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
  email: string
  image: string | null
  createdAt: Date
  providers: string[]
  wallets: { id: string; address: string; chainId: number; isPrimary: boolean | null }[]
  recentComments: { id: number; marketId: string; body: string; createdAt: Date }[]
  recentVotes: { id: number; marketId: string; vote: string; createdAt: Date }[]
}

export async function getAccountData(): Promise<AccountData | null> {
  const session = await getSession()
  if (!session?.user) return null
  const userId = session.user.id

  const [userData, accounts, wallets, comments, votes] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1),
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, userId)),
    db
      .select({
        id: walletAddress.id,
        address: walletAddress.address,
        chainId: walletAddress.chainId,
        isPrimary: walletAddress.isPrimary,
      })
      .from(walletAddress)
      .where(eq(walletAddress.userId, userId)),
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
  ])

  if (!userData[0]) return null

  return {
    ...userData[0],
    providers: accounts.map((a) => a.providerId),
    wallets,
    recentComments: comments,
    recentVotes: votes,
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
  if (!trimmed || trimmed.length < 2) return { ok: false, error: 'Name must be at least 2 characters.' }
  if (trimmed.length > 40) return { ok: false, error: 'Name must be 40 characters or less.' }

  await db.update(user).set({ name: trimmed, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/account')
  return { ok: true }
}
