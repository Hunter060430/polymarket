import { redirect } from 'next/navigation'

// OAuth + wallet only — no separate sign-up flow needed.
export default function SignUpPage() {
  redirect('/sign-in')
}
