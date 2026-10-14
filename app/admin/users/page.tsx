import { getAdminUsers, getAdminStats } from '@/app/actions/admin'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export default async function AdminUsersPage() {
  const [users, stats] = await Promise.all([getAdminUsers(), getAdminStats()])
  return <AdminUsersClient users={users} stats={stats} />
}
