import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  unique,
  date,
  index,
  json,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  // Verdict community profile fields
  username: text('username').unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// SIWE wallet addresses (managed by the better-auth siwe plugin)
export const walletAddress = pgTable('walletAddress', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  chainId: integer('chainId').notNull(),
  isPrimary: boolean('isPrimary').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// --- Verdict community app tables ------------------------------------------
// marketId is the Polymarket market id/slug (text). userId scopes ownership.

export const marketComment = pgTable(
  'market_comment',
  {
    id: serial('id').primaryKey(),
    marketId: text('marketId').notNull(),
    userId: text('userId').notNull(),
    body: text('body').notNull(),
    parentId: integer('parentId'),
    upvotes: integer('upvotes').notNull().default(0),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => ({
    marketIdx: index('idx_comment_market').on(t.marketId, t.createdAt),
  }),
)

export const commentVote = pgTable(
  'comment_vote',
  {
    id: serial('id').primaryKey(),
    commentId: integer('commentId').notNull(),
    userId: text('userId').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => ({
    commentUserUnique: unique().on(t.commentId, t.userId),
  }),
)

export const riskVote = pgTable(
  'risk_vote',
  {
    id: serial('id').primaryKey(),
    marketId: text('marketId').notNull(),
    userId: text('userId').notNull(),
    vote: text('vote').notNull(), // 'low' | 'medium' | 'high' | 'critical'
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => ({
    marketUserUnique: unique().on(t.marketId, t.userId),
    marketIdx: index('idx_riskvote_market').on(t.marketId),
  }),
)

// Caches AI semantic analysis results per market. Written once on the first
// analysis request; all subsequent requests return the cached result immediately
// without calling the LLM — ensuring one AI run per market globally.
export const aiScoreCache = pgTable('ai_score_cache', {
  marketId:  text('market_id').primaryKey(),
  result:    json('result').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Records the actual resolution outcome for closed markets, used for
// back-testing whether the algorithmic risk score predicted disputes correctly.
export const marketResolution = pgTable('market_resolution', {
  id: text('id').primaryKey(),
  marketId: text('market_id').notNull().unique(),
  marketSlug: text('market_slug'),
  question: text('question'),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'), // 'yes' | 'no' | 'n/a' | 'disputed' | 'cancelled'
  wasDisputed: boolean('was_disputed').notNull().default(false),
  disputeNotes: text('dispute_notes'),
  riskLevelAtClose: text('risk_level_at_close'),
  scoreAtClose: integer('score_at_close'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Pre-Season points ledger — one row per user, updated atomically on each award.
export const preSeasonPoints = pgTable('pre_season_points', {
  userId:    text('user_id').primaryKey(),
  points:    integer('points').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Tracks which one-time tasks each user has completed during Pre-Season.
export const preSeasonTaskCompletions = pgTable(
  'pre_season_task_completions',
  {
    id:          serial('id').primaryKey(),
    userId:      text('user_id').notNull(),
    taskKey:     text('task_key').notNull(),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (t) => ({ uniq: unique().on(t.userId, t.taskKey) }),
)

// Daily check-in log — one row per user per UTC date for streak tracking.
export const preSeasonDailyCheckins = pgTable(
  'pre_season_daily_checkins',
  {
    id:              serial('id').primaryKey(),
    userId:          text('user_id').notNull(),
    checkedInDate:   date('checked_in_date').notNull(),
  },
  (t) => ({ uniq: unique().on(t.userId, t.checkedInDate) }),
)

// Tracks which scarce Genesis badges each user has claimed.
export const genesisBadgeClaims = pgTable(
  'genesis_badge_claims',
  {
    id:        serial('id').primaryKey(),
    userId:    text('user_id').notNull(),
    badgeKey:  text('badge_key').notNull(),
    claimedAt: timestamp('claimed_at').notNull().defaultNow(),
  },
  (t) => ({ uniq: unique().on(t.userId, t.badgeKey) }),
)

// Tracks community reputation accumulated through comments, votes, and
// accurate risk predictions. Badge thresholds: Observer 0–9, Contributor 10–49, Expert 50+.
export const userReputation = pgTable('user_reputation', {
  userId: text('user_id').primaryKey(),
  commentCount: integer('comment_count').notNull().default(0),
  voteCount: integer('vote_count').notNull().default(0),
  helpfulVotes: integer('helpful_votes').notNull().default(0),
  score: integer('score').notNull().default(0),
  badge: text('badge').notNull().default('Observer'), // 'Observer' | 'Contributor' | 'Expert'
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
