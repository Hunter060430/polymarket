export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AdminNav } from '@/components/admin/admin-nav'

async function requireAdmin() {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })
  if (!session?.user) redirect('/sign-in')
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!u || u.role !== 'admin') redirect('/')
  return session.user
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await requireAdmin()
  return (
    <div className="min-h-screen bg-background">
      <AdminNav adminName={adminUser.name ?? 'Admin'} />
      {children}
    </div>
  )
}
