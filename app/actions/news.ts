'use server'

import { db } from '@/lib/db'
import { newsMarketOverride, newsPost, user } from '@/lib/db/schema'
import { and, desc, eq, ilike, ne, or } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type NewsCategory = 'news' | 'analysis' | 'product-update'
export type NewsInput = {
  title: string
  summary: string
  body: string
  category: NewsCategory
  sourceUrl: string
  sourceName: string
  reportedAt: string
  published: boolean
}

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function requireAdmin() {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')
  const [record] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (record?.role !== 'admin') throw new Error('Forbidden: admin only')
  return session.user
}

const publicFields = {
  id: newsPost.id,
  slug: newsPost.slug,
  title: newsPost.title,
  summary: newsPost.summary,
  body: newsPost.body,
  category: newsPost.category,
  sourceUrl: newsPost.sourceUrl,
  sourceName: newsPost.sourceName,
  reportedAt: newsPost.reportedAt,
  verifiedAt: newsPost.verifiedAt,
  publishedAt: newsPost.publishedAt,
  authorName: user.name,
}

export async function getPublishedNews() {
  return db.select({
    id: newsPost.id, slug: newsPost.slug, title: newsPost.title,
    summary: newsPost.summary, category: newsPost.category,
    sourceName: newsPost.sourceName, reportedAt: newsPost.reportedAt,
    publishedAt: newsPost.publishedAt, authorName: user.name,
  }).from(newsPost).innerJoin(user, eq(newsPost.authorId, user.id))
    .where(eq(newsPost.published, true)).orderBy(desc(newsPost.reportedAt), desc(newsPost.publishedAt))
}

export async function getPublishedNewsForMatching() {
  return db.select(publicFields).from(newsPost).innerJoin(user, eq(newsPost.authorId, user.id))
    .where(eq(newsPost.published, true)).orderBy(desc(newsPost.reportedAt), desc(newsPost.publishedAt))
}

export async function getNewsBySlug(slug: string) {
  const [post] = await db.select(publicFields).from(newsPost)
    .innerJoin(user, eq(newsPost.authorId, user.id))
    .where(and(eq(newsPost.slug, slug), eq(newsPost.published, true))).limit(1)
  if (!post) return null
  const overrides = await db.select().from(newsMarketOverride).where(eq(newsMarketOverride.newsPostId, post.id))
  return { ...post, overrides }
}

export async function getAllNewsAdmin() {
  await requireAdmin()
  return db.select({
    id: newsPost.id, slug: newsPost.slug, title: newsPost.title,
    summary: newsPost.summary, body: newsPost.body, category: newsPost.category,
    sourceUrl: newsPost.sourceUrl, sourceName: newsPost.sourceName,
    reportedAt: newsPost.reportedAt, verifiedAt: newsPost.verifiedAt,
    published: newsPost.published, publishedAt: newsPost.publishedAt,
    createdAt: newsPost.createdAt,
  }).from(newsPost).orderBy(desc(newsPost.createdAt))
}

function toSlug(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80)}-${Date.now().toString(36)}`
}

function normalizeNewsInput(data: NewsInput) {
  const title = data.title.trim()
  const summary = data.summary.trim()
  const body = data.body.trim()
  const sourceUrl = data.sourceUrl.trim()
  const sourceName = data.sourceName.trim()
  const reportedAt = new Date(data.reportedAt)
  if (!title || !summary || !body) throw new Error('Title, summary, and body are required.')
  if (!['news', 'analysis', 'product-update'].includes(data.category)) throw new Error('Invalid category.')
  if (data.published && (!sourceUrl || !sourceName || Number.isNaN(reportedAt.getTime()))) {
    throw new Error('Published posts require a source name, valid source URL, and reported date.')
  }
  if (sourceUrl) {
    const url = new URL(sourceUrl)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Source URL must use HTTP or HTTPS.')
  }
  return { title, summary, body, sourceUrl: sourceUrl || null, sourceName: sourceName || null, reportedAt: Number.isNaN(reportedAt.getTime()) ? null : reportedAt }
}

export async function findDuplicateNews(title: string, sourceUrl: string, excludeId?: number) {
  await requireAdmin()
  const clauses = [ilike(newsPost.title, title.trim()), eq(newsPost.sourceUrl, sourceUrl.trim())]
  const match = or(...clauses)
  const where = excludeId ? and(match, ne(newsPost.id, excludeId)) : match
  return db.select({ id: newsPost.id, title: newsPost.title, slug: newsPost.slug })
    .from(newsPost).where(where).limit(3)
}

export async function createNewsPost(data: NewsInput) {
  const adminUser = await requireAdmin()
  const clean = normalizeNewsInput(data)
  const duplicates = await findDuplicateNews(clean.title, clean.sourceUrl ?? '')
  if (duplicates.length) throw new Error(`Possible duplicate: ${duplicates[0].title}`)
  const slug = toSlug(clean.title)
  await db.insert(newsPost).values({
    slug, ...clean, category: data.category, published: data.published,
    verifiedAt: data.published ? new Date() : null,
    authorId: adminUser.id, publishedAt: data.published ? new Date() : null, updatedAt: new Date(),
  })
  revalidatePath('/news'); revalidatePath('/admin/news')
  return { slug }
}

export async function updateNewsPost(id: number, data: NewsInput) {
  await requireAdmin()
  const clean = normalizeNewsInput(data)
  const duplicates = await findDuplicateNews(clean.title, clean.sourceUrl ?? '', id)
  if (duplicates.length) throw new Error(`Possible duplicate: ${duplicates[0].title}`)
  const [current] = await db.select({ published: newsPost.published, publishedAt: newsPost.publishedAt })
    .from(newsPost).where(eq(newsPost.id, id)).limit(1)
  if (!current) throw new Error('Post not found.')
  await db.update(newsPost).set({
    ...clean, category: data.category, published: data.published,
    verifiedAt: data.published ? new Date() : null,
    publishedAt: data.published && !current.published ? new Date() : current.publishedAt,
    updatedAt: new Date(),
  }).where(eq(newsPost.id, id))
  revalidatePath('/news'); revalidatePath('/admin/news')
}

export async function setNewsMarketOverride(newsPostId: number, market: { id: string; question: string }, mode: 'include' | 'exclude') {
  await requireAdmin()
  await db.insert(newsMarketOverride).values({ newsPostId, marketId: market.id, marketQuestion: market.question, mode })
    .onConflictDoUpdate({ target: [newsMarketOverride.newsPostId, newsMarketOverride.marketId], set: { mode, marketQuestion: market.question } })
  revalidatePath('/news')
}

export async function removeNewsMarketOverride(newsPostId: number, marketId: string) {
  await requireAdmin()
  await db.delete(newsMarketOverride).where(and(eq(newsMarketOverride.newsPostId, newsPostId), eq(newsMarketOverride.marketId, marketId)))
  revalidatePath('/news')
}

export async function deleteNewsPost(id: number) {
  await requireAdmin()
  await db.delete(newsPost).where(eq(newsPost.id, id))
  revalidatePath('/news'); revalidatePath('/admin/news')
}

export async function checkIsAdmin() {
  const session = await getSession()
  if (!session?.user) return false
  const [record] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  return record?.role === 'admin'
}
