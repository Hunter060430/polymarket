import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  unique,
  index,
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
  username: text('username'),
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
