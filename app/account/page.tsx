export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { Nav, PageFooter } from '@/components/nav'
import { AccountClient } from '@/components/account/account-client'
import { getAccountData } from '@/app/actions/account'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account — Verdict',
  description: 'Manage your Verdict account, connected wallets, and activity.',
}

export default async function AccountPage() {
  const data = await getAccountData()
  if (!data) redirect('/sign-in')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and view your activity.</p>
        </div>
        <AccountClient data={data} />
      </main>
      <PageFooter />
    </div>
  )
}
