import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
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
// App tables use uuid PKs and a plain `userId` column for per-user scoping.

export const marketCategories = pgTable('market_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const markets = pgTable('markets', {
  id: uuid('id').primaryKey().defaultRandom(),
  polymarketId: text('polymarket_id'),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  categoryId: uuid('category_id'),
  url: text('url'),
  riskScore: integer('risk_score'),
  riskLevel: text('risk_level'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const marketComments = pgTable(
  'market_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    marketId: uuid('market_id').notNull(),
    userId: text('user_id').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    marketIdx: index('comments_market_idx').on(t.marketId),
  }),
)

export const marketRiskVotes = pgTable(
  'market_risk_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    marketId: uuid('market_id').notNull(),
    userId: text('user_id').notNull(),
    vote: text('vote').notNull(), // 'low' | 'medium' | 'high' | 'critical'
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    marketUserUnique: unique('votes_market_user_unique').on(t.marketId, t.userId),
    marketIdx: index('votes_market_idx').on(t.marketId),
  }),
)
