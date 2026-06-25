import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Verdict',
  description:
    'Privacy Policy for Verdict (ver.watch). Learn what data we collect, how we use it, and your rights.',
}

const LAST_UPDATED = 'June 25, 2026'

const SECTIONS = [
  {
    heading: 'Who we are',
    body: 'Verdict ("we", "our", "us") is an independent prediction-market clarity index operated at ver.watch. We are not affiliated with Polymarket or any other prediction market platform. For privacy enquiries, contact us via the feedback form on the About page.',
  },
  {
    heading: 'What data we collect',
    body: 'When you create an account we store your email address (Google OAuth) or Ethereum wallet address (SIWE), a display name you choose, and a hashed session token. We do not store passwords. When you post a comment or cast a community risk vote, that content is stored against your user ID. We do not collect payment information, precise location, or any sensitive personal data.',
  },
  {
    heading: 'How we use your data',
    body: 'Your data is used solely to operate the service: authenticating you across sessions, displaying your activity on your Account page, and attributing comments and votes. We do not sell, rent, or share your personal data with third parties for marketing purposes. Aggregated, anonymised statistics (e.g. total vote counts per risk level) may be displayed publicly.',
  },
  {
    heading: 'Cookies and local storage',
    body: 'We use one essential session cookie set by Better Auth to keep you signed in. We also use browser localStorage to persist your watchlist and cookie-consent preference — this data never leaves your device. We do not use advertising cookies, tracking pixels, or third-party analytics scripts beyond Vercel Analytics (which collects only aggregate, anonymised page-view data with no cross-site tracking).',
  },
  {
    heading: 'Third-party services',
    body: 'We use the following sub-processors: Vercel (hosting and analytics, US/EU), Neon (PostgreSQL database, US), and Google (OAuth sign-in). Each processes only the minimum data required to deliver its function. Polymarket data is read from their public Gamma API — no personal data is sent to Polymarket.',
  },
  {
    heading: 'Data retention',
    body: 'Account data is retained for as long as your account is active. If you delete your account, your profile and associated comments and votes are permanently deleted within 30 days. Session tokens are invalidated immediately on sign-out. Backups may retain data for up to 90 days after deletion.',
  },
  {
    heading: 'Your rights',
    body: 'Depending on your jurisdiction you may have the right to access, correct, or delete your personal data; to object to or restrict certain processing; and to data portability. To exercise these rights, sign in to your Account page (where you can update your display name) or contact us via the About page. We will respond within 30 days.',
  },
  {
    heading: 'Children',
    body: 'Verdict is not directed at children under the age of 13 (or 16 in the EU/EEA). We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.',
  },
  {
    heading: 'Changes to this policy',
    body: 'We may update this policy from time to time. Material changes will be announced via a notice on the site. The "Last updated" date at the top of this page always reflects the most recent revision. Continued use of the service after a change constitutes acceptance of the updated policy.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 flex flex-col gap-0">

        {/* Page header */}
        <div className="border-b border-border pb-10 mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-primary" aria-hidden="true" />
            <p className="text-xs tracking-[0.2em] uppercase text-primary">Legal</p>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-light tracking-tight text-foreground leading-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed font-heading font-light max-w-2xl text-pretty">
            How Verdict collects, uses, and protects your personal data.
          </p>
          <p className="text-xs text-muted-foreground mt-6 tabular-nums">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Sections */}
        <section className="divide-y divide-border border-t border-border">
          {SECTIONS.map((s, i) => (
            <div
              key={s.heading}
              className="py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-12"
            >
              <div className="flex items-start gap-4">
                <span className="text-xs tracking-[0.1em] uppercase text-muted-foreground tabular-nums pt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="font-heading text-2xl font-light text-foreground leading-snug">
                  {s.heading}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed self-center">
                {s.body}
              </p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="border-t border-border mt-12 pt-12">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="inline-flex items-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
            >
              Terms of Service
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/disclaimer"
              className="inline-flex items-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
            >
              Disclaimer
            </Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
