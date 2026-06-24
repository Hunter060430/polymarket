import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { Nav, PageFooter } from '@/components/nav'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata = { title: 'Sign Up — Verdict' }

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <AuthForm mode="sign-up" />
      </main>
      <PageFooter />
    </div>
  )
}
