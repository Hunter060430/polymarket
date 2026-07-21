import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAllNewsAdmin } from '@/app/actions/news'
import { AdminNewsClient } from '@/components/admin/admin-news-client'

export default async function AdminNewsPage() {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })
  const posts = await getAllNewsAdmin()

  return <AdminNewsClient posts={posts} adminName={session?.user?.name ?? 'Admin'} />
}
