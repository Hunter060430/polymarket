import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Every serverless instance owns its own pool, so keep it small and let idle
// connections close quickly. Neon can only scale compute to zero once nothing
// is holding a connection open.
const globalForDb = globalThis as unknown as { __verdictPgPool?: Pool }

export const pool =
  globalForDb.__verdictPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__verdictPgPool = pool

export const db = drizzle(pool, { schema })
