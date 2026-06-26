// lib/reputation.ts
// Upserts user_reputation after a community action and recalculates the badge.
// Called server-side from community server actions. Never throws — reputation
// updates are best-effort and should not fail a primary action.

import { db } from '@/lib/db'
import { userReputation } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export type ReputationAction = 'comment' | 'vote' | 'helpful_vote'

// Badge thresholds (score-based)
const BADGE_THRESHOLDS = [
  { min: 50, badge: 'Expert' },
  { min: 10, badge: 'Contributor' },
  { min: 0,  badge: 'Observer' },
] as const

function deriveBadge(score: number): string {
  return BADGE_THRESHOLDS.find((t) => score >= t.min)?.badge ?? 'Observer'
}

// Score increments per action
const ACTION_SCORE: Record<ReputationAction, number> = {
  comment:      2,
  vote:         1,
  helpful_vote: 3,
}

export async function upsertReputation(
  userId: string,
  action: ReputationAction,
): Promise<void> {
  try {
    const delta = ACTION_SCORE[action]
    const commentDelta      = action === 'comment'      ? 1 : 0
    const voteDelta         = action === 'vote'         ? 1 : 0
    const helpfulVoteDelta  = action === 'helpful_vote' ? 1 : 0

    // Get or create the row, then update atomically
    const existing = await db
      .select()
      .from(userReputation)
      .where(eq(userReputation.userId, userId))
      .limit(1)

    if (existing.length === 0) {
      const newScore = delta
      await db.insert(userReputation).values({
        userId,
        commentCount:  commentDelta,
        voteCount:     voteDelta,
        helpfulVotes:  helpfulVoteDelta,
        score:         newScore,
        badge:         deriveBadge(newScore),
        updatedAt:     new Date(),
      })
    } else {
      const newScore = existing[0].score + delta
      await db
        .update(userReputation)
        .set({
          commentCount:  sql`${userReputation.commentCount} + ${commentDelta}`,
          voteCount:     sql`${userReputation.voteCount} + ${voteDelta}`,
          helpfulVotes:  sql`${userReputation.helpfulVotes} + ${helpfulVoteDelta}`,
          score:         newScore,
          badge:         deriveBadge(newScore),
          updatedAt:     new Date(),
        })
        .where(eq(userReputation.userId, userId))
    }
  } catch (err) {
    // Best-effort — log but do not surface to caller
    console.error('[reputation] upsert failed for', userId, err)
  }
}

export async function getReputation(userId: string) {
  const rows = await db
    .select()
    .from(userReputation)
    .where(eq(userReputation.userId, userId))
    .limit(1)
  return rows[0] ?? null
}
