import { getAdminFeedback } from '@/app/actions/admin'
import { AdminFeedbackClient } from '@/components/admin/admin-feedback-client'

export default async function AdminFeedbackPage() {
  const feedback = await getAdminFeedback()
  return <AdminFeedbackClient feedback={feedback} />
}
