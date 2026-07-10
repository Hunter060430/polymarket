export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAllNewsAdmin } from '@/app/actions/news'
import { AdminNewsClient } from '@/components/admin/admin-news-client'

async function requireAdminPage() {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })
  if (!session?.user) redirect('/auth/sign-in')
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!u || u.role !== 'admin') redirect('/')
  return session.user
}

export default async function AdminNewsPage() {
  const adminUser = await requireAdminPage()
  const posts = await getAllNewsAdmin()

  return <AdminNewsClient posts={posts} adminName={adminUser.name ?? 'Admin'} />
}
