'use server'

import { db } from '@/lib/db'
import { newsPost, user } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ── Auth helpers ────────────────────────────────────────────────────────────

async function getSession() {
  const h = await headers()
  return auth.api.getSession({ headers: h })
}

async function requireAdmin() {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!u || u.role !== 'admin') throw new Error('Forbidden: admin only')
  return session.user
}

// ── Public queries ──────────────────────────────────────────────────────────

export async function getPublishedNews() {
  return db
    .select({
      id:          newsPost.id,
      slug:        newsPost.slug,
      title:       newsPost.title,
      summary:     newsPost.summary,
      category:    newsPost.category,
      publishedAt: newsPost.publishedAt,
      authorName:  user.name,
    })
    .from(newsPost)
    .innerJoin(user, eq(newsPost.authorId, user.id))
    .where(eq(newsPost.published, true))
    .orderBy(desc(newsPost.publishedAt))
}

export async function getPublishedNewsForMatching() {
  return db
    .select({
      id:          newsPost.id,
      slug:        newsPost.slug,
      title:       newsPost.title,
      summary:     newsPost.summary,
      body:        newsPost.body,
      category:    newsPost.category,
      publishedAt: newsPost.publishedAt,
      authorName:  user.name,
    })
    .from(newsPost)
    .innerJoin(user, eq(newsPost.authorId, user.id))
    .where(eq(newsPost.published, true))
    .orderBy(desc(newsPost.publishedAt))
}

export async function getNewsBySlug(slug: string) {
  const [post] = await db
    .select({
      id:          newsPost.id,
      slug:        newsPost.slug,
      title:       newsPost.title,
      summary:     newsPost.summary,
      body:        newsPost.body,
      category:    newsPost.category,
      publishedAt: newsPost.publishedAt,
      authorName:  user.name,
    })
    .from(newsPost)
    .innerJoin(user, eq(newsPost.authorId, user.id))
    .where(and(eq(newsPost.slug, slug), eq(newsPost.published, true)))
    .limit(1)
  return post ?? null
}

// ── Admin queries ───────────────────────────────────────────────────────────

export async function getAllNewsAdmin() {
  await requireAdmin()
  return db
    .select({
      id:          newsPost.id,
      slug:        newsPost.slug,
      title:       newsPost.title,
      summary:     newsPost.summary,
      category:    newsPost.category,
      published:   newsPost.published,
      publishedAt: newsPost.publishedAt,
      createdAt:   newsPost.createdAt,
    })
    .from(newsPost)
    .orderBy(desc(newsPost.createdAt))
}

// ── Admin mutations ─────────────────────────────────────────────────────────

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
    + '-' + Date.now().toString(36)
}

export async function createNewsPost(data: {
  title: string
  summary: string
  body: string
  category: string
  published: boolean
}) {
  const adminUser = await requireAdmin()
  const slug = toSlug(data.title)
  await db.insert(newsPost).values({
    slug,
    title:       data.title,
    summary:     data.summary,
    body:        data.body,
    category:    data.category,
    published:   data.published,
    authorId:    adminUser.id,
    publishedAt: data.published ? new Date() : null,
    updatedAt:   new Date(),
  })
  revalidatePath('/news')
  revalidatePath('/admin/news')
  return { slug }
}

export async function updateNewsPost(id: number, data: {
  title: string
  summary: string
  body: string
  category: string
  published: boolean
}) {
  await requireAdmin()
  const current = await db.select({ published: newsPost.published, publishedAt: newsPost.publishedAt })
    .from(newsPost).where(eq(newsPost.id, id)).limit(1)
  const wasPublished = current[0]?.published ?? false
  await db.update(newsPost).set({
    title:       data.title,
    summary:     data.summary,
    body:        data.body,
    category:    data.category,
    published:   data.published,
    publishedAt: data.published && !wasPublished ? new Date() : current[0]?.publishedAt ?? null,
    updatedAt:   new Date(),
  }).where(eq(newsPost.id, id))
  revalidatePath('/news')
  revalidatePath('/admin/news')
}

export async function deleteNewsPost(id: number) {
  await requireAdmin()
  await db.delete(newsPost).where(eq(newsPost.id, id))
  revalidatePath('/news')
  revalidatePath('/admin/news')
}

export async function checkIsAdmin() {
  const session = await getSession()
  if (!session?.user) return false
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  return u?.role === 'admin'
}
