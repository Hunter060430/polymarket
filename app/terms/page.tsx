import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Verdict',
  description:
    'Terms of Service for Verdict (ver.watch). Read the rules governing your use of the service.',
}

const LAST_UPDATED = 'June 25, 2026'

const SECTIONS = [
  {
    heading: 'Acceptance of terms',
    body: 'By accessing or using Verdict at ver.watch ("the Service") you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We may update these terms at any time; continued use after a change constitutes acceptance.',
  },
  {
    heading: 'Description of service',
    body: 'Verdict is a free, independent clarity-scoring index for prediction markets. It retrieves public data from the Polymarket Gamma API and applies heuristic scoring. Scores are informational only and do not constitute financial, investment, or legal advice. The Service is provided "as is" without warranty of any kind.',
  },
  {
    heading: 'Accounts',
    body: 'You may create an account using Google OAuth or an Ethereum wallet (SIWE). You are responsible for maintaining the security of your credentials and wallet. You must be at least 13 years old (16 in the EU/EEA) to create an account. We reserve the right to suspend or terminate accounts that violate these terms.',
  },
  {
    heading: 'User-generated content',
    body: 'By posting comments or community risk votes you grant Verdict a worldwide, royalty-free, non-exclusive licence to display that content as part of the Service. You retain ownership of your content. You must not post content that is unlawful, abusive, defamatory, or spam. We may remove content that violates these terms without notice.',
  },
  {
    heading: 'Prohibited conduct',
    body: 'You must not: attempt to access systems or data you are not authorised to access; use automated scripts to scrape or overload the Service; impersonate another person; post false or misleading information; or use the Service to facilitate illegal activity. Violation may result in immediate termination of your account.',
  },
  {
    heading: 'Intellectual property',
    body: 'The Verdict name, logo, scoring methodology, and original site content are the intellectual property of Verdict and its operators. Market data originates from Polymarket and is subject to their terms. You may not reproduce or redistribute Verdict content for commercial purposes without written permission.',
  },
  {
    heading: 'Limitation of liability',
    body: 'To the maximum extent permitted by applicable law, Verdict and its operators shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including losses from trading decisions made in reliance on scores or data displayed. Your sole remedy for dissatisfaction with the Service is to stop using it.',
  },
  {
    heading: 'Governing law',
    body: 'These terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved by the courts of competent jurisdiction. If any provision of these terms is found to be invalid, the remaining provisions shall continue in full force and effect.',
  },
]

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed font-heading font-light max-w-2xl text-pretty">
            Please read these terms carefully before using Verdict.
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
              href="/privacy"
              className="inline-flex items-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
            >
              Privacy Policy
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
