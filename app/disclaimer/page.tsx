import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'Legal disclaimer for Verdict — an independent, non-affiliated prediction market clarity index. Scores are heuristic estimates, not financial or legal advice.',
}

const SECTIONS = [
  {
    heading: 'Not financial advice',
    body: 'Verdict scores are heuristic estimates produced by a deterministic text-analysis model. They are not financial advice, investment advice, or trading recommendations. Nothing on this site should be interpreted as a suggestion to buy, sell, or hold any position in any prediction market. You are solely responsible for your own trading decisions.',
  },
  {
    heading: 'Scores are estimates, not guarantees',
    body: 'A high clarity score does not guarantee that a market will be resolved correctly, fairly, or in line with your expectations. A low score does not mean a market will necessarily be resolved incorrectly. Scores measure only the written clarity of resolution criteria — not the honesty of any party, the accuracy of the underlying event, or the final outcome.',
  },
  {
    heading: 'No affiliation with Polymarket',
    body: 'Verdict is an independent project. It is not affiliated with, endorsed by, sponsored by, or in any commercial relationship with Polymarket or any other prediction market platform. All market data is retrieved from the public Polymarket Gamma API, which requires no authentication for read access. "Polymarket" and related marks are the property of their respective owners.',
  },
  {
    heading: 'Heuristic methodology',
    body: 'The scoring engine relies on rule-based text heuristics. It can produce false positives (rating an ambiguous market as clear) and false negatives (rating a clear market as ambiguous). Known limitations are documented openly on the Methodology page. Scores should be treated as one input among many, accurate to roughly ±8 points.',
  },
  {
    heading: 'Data accuracy and availability',
    body: 'Market data is cached and refreshed periodically and may be delayed, incomplete, or temporarily unavailable. Verdict makes no warranty as to the accuracy, completeness, or timeliness of any data displayed. The service is provided "as is" and "as available," without warranties of any kind.',
  },
  {
    heading: 'Public-interest purpose',
    body: 'Verdict is operated on a non-profit, public-interest basis. It issues no token, sells no financial products, and does not encourage harassment, abuse, or coordinated action against any individual or platform. User-submitted dispute documentation, where applicable, is collected for transparency and analysis only and does not constitute legal action.',
  },
  {
    heading: 'Limitation of liability',
    body: 'To the maximum extent permitted by law, Verdict and its operators shall not be liable for any direct, indirect, incidental, or consequential losses arising from the use of, or reliance on, the information provided. By using this site you agree that you do so at your own risk.',
  },
]

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 flex flex-col gap-0">

        {/* ── Page header ───────────────────────────────── */}
        <div className="border-b border-border pb-10 mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-primary" aria-hidden="true" />
            <p className="text-xs tracking-[0.2em] uppercase text-primary">Legal</p>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-light tracking-tight text-foreground leading-tight">
            Disclaimer
          </h1>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed font-heading font-light max-w-2xl text-pretty">
            Please read carefully before relying on any information published on Verdict.
          </p>
        </div>

        {/* ── Sections ──────────────────────────────────── */}
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

        {/* ── CTA ───────────────────────────────────────── */}
        <section className="border-t border-border mt-12 pt-12">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
            >
              Read the Methodology
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
            >
              About Verdict
            </Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
