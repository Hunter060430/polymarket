import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Verdict is an independent watchdog for prediction market resolution quality. Learn about our mission, methodology, and principles.',
}

const PRINCIPLES = [
  {
    num: '01',
    title: 'Deterministic',
    body: 'Every score is produced by the same documented ruleset. No human judgment, no black boxes. The same market, scored twice, produces the same result.',
  },
  {
    num: '02',
    title: 'Transparent',
    body: 'The full scoring methodology is published. Every rule, every weight, every edge case. If you disagree with a rule, you can submit feedback.',
  },
  {
    num: '03',
    title: 'Independent',
    body: 'Verdict has no financial relationship with Polymarket or any prediction market platform. We use only publicly available data from the Polymarket Gamma API.',
  },
  {
    num: '04',
    title: 'Conservative',
    body: 'When in doubt, we flag it. A false positive (flagging a well-specified market) is a lower harm than a false negative (missing a genuinely ambiguous one).',
  },
]

const FAQS = [
  {
    q: 'What does a low score mean?',
    a: 'A low score means the written resolution criteria are underspecified relative to the complexity of the event being measured. It does not mean the market is fraudulent or that it will be resolved incorrectly — only that the written rules leave room for interpretation.',
  },
  {
    q: 'Can scores be gamed?',
    a: 'To some extent, yes. A market operator could add verbose but meaningless text to inflate certain dimensions. Future versions of the model will incorporate resolution history and semantic analysis to reduce this. We document this limitation explicitly in the methodology.',
  },
  {
    q: 'How often is data updated?',
    a: 'Market data is fetched from the Polymarket Gamma API and cached for 5 minutes. Scores are recalculated on each data refresh. There is currently no historical score tracking.',
  },
  {
    q: 'Is this affiliated with Polymarket?',
    a: 'No. Verdict is entirely independent. We use only the public Gamma API, which requires no authentication for read access. We have no commercial relationship with Polymarket.',
  },
  {
    q: 'How do I report a disputed resolution?',
    a: 'Use the Submit Dispute form. We collect structured case information for documentation and analysis. Submission does not initiate any legal action. Anonymized cases may be published in the public interest.',
  },
  {
    q: 'What markets does Verdict cover?',
    a: 'Currently, Verdict covers active, non-closed markets on Polymarket with non-zero trading volume. Markets are fetched sorted by volume, up to 500 at a time, and refreshed every 5 minutes.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12 flex flex-col gap-0">

        {/* ── Page header ───────────────────────────────── */}
        <div className="border-b border-border pb-10 mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-primary" aria-hidden="true" />
            <p className="text-xs tracking-[0.2em] uppercase text-primary">About</p>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-light tracking-tight text-foreground leading-tight">
            Verdict
          </h1>
          <p className="text-xl text-muted-foreground mt-4 leading-relaxed font-heading font-light max-w-xl">
            An independent watchdog for prediction market resolution quality.
          </p>
        </div>

        {/* ── Origin story ──────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-6">Our Story</h2>

          <p className="text-lg sm:text-xl font-heading font-light text-foreground leading-relaxed max-w-2xl mb-8 text-pretty">
            Verdict was born out of a real case of unfairness in the prediction market industry.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
            <p>
              The project was founded by <span className="text-foreground">Hunter Guo</span>, a
              20-year-old second-year student at King&apos;s College London. After personally
              living through a highly controversial Polymarket settlement — a market resolved against
              what he believed was the clear spirit of its own rules — Hunter realized that individual
              users have almost no effective tools when facing opaque platform decisions.
            </p>
            <p>
              For most traders, once a market is resolved unfairly, the options are bleak. You can
              complain on social media, send emails that may never be answered, or simply accept the
              loss. There is no public database of disputed resolutions, no structured way to preserve
              evidence, and no neutral place for affected users to document what happened.
            </p>
            <p>
              Verdict was built to change that. It is a non-profit, public-interest platform designed
              to help users record, organize, and publish cases of unfair or controversial prediction
              market resolutions — submitting experiences, preserving evidence, generating public case
              cards, and contributing to a growing archive of disputed markets.
            </p>
            <p>
              The goal is not revenge. It is transparency. Prediction markets can only survive if
              users trust that rules are applied clearly, consistently, and fairly. Verdict aims to be
              a public accountability layer for the industry — documenting disputes, exposing unclear
              rules, and giving ordinary users a voice when platforms fail to listen.
            </p>
          </div>

          <div className="mt-8 border-l-2 border-primary pl-5 py-1">
            <p className="text-sm text-foreground leading-relaxed max-w-2xl">
              Verdict is entirely public-interest driven. It issues no token, sells no financial
              products, and never encourages harassment or abuse. Its purpose is simple: protect
              users, preserve evidence, and push the industry toward fairer standards.
            </p>
          </div>
        </section>

        {/* ── Mission ───────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-6">Mission</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
            <p>
              Prediction markets are a powerful mechanism for aggregating information — but they only
              work when participants can trust that outcomes will be resolved according to clear,
              pre-specified rules. When rules are ambiguous, resolutions become judgment calls, and
              judgment calls become disputes.
            </p>
            <p>
              Verdict exists to surface that ambiguity before money is at risk. We score every active
              Polymarket market across six dimensions of resolution quality and publish those scores
              publicly, for free, with full methodology documentation.
            </p>
            <p>
              We are not anti-prediction markets. We believe transparency about rule quality
              strengthens the ecosystem, reduces post-resolution conflict, and rewards operators who
              write careful, well-specified markets.
            </p>
            <p>
              Over time, we aim to build a historical record of market resolution quality, track how
              scores correlate with actual dispute rates, and provide tooling for the broader
              prediction market community.
            </p>
          </div>
        </section>

        {/* ── Principles ────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-8">Principles</h2>
          <div className="divide-y divide-border border-t border-border">
            {PRINCIPLES.map((p) => (
              <div key={p.num} className="py-8 grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 lg:gap-12">
                <div>
                  <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-1">{p.num}</p>
                  <p className="font-heading text-2xl font-light text-foreground">{p.title}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed self-center">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Data sources ──────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-6">Data Sources</h2>
          <div className="border border-border divide-y divide-border">
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Source</p>
              <p className="text-sm text-foreground">
                Polymarket Gamma API{' '}
                <a
                  href="https://gamma-api.polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline underline-offset-4"
                >
                  gamma-api.polymarket.com ↗
                </a>
              </p>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Coverage</p>
              <p className="text-sm text-foreground">Active, non-closed markets with non-zero volume</p>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Refresh Rate</p>
              <p className="text-sm text-foreground">5-minute cache revalidation</p>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Authentication</p>
              <p className="text-sm text-foreground">None — public read API only</p>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Affiliation</p>
              <p className="text-sm text-foreground">None. Verdict is independent of Polymarket.</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="divide-y divide-border border-t border-border">
            {FAQS.map((faq) => (
              <div key={faq.q} className="py-7 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-12">
                <p className="text-sm font-medium text-foreground leading-snug">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-6">Disclaimer</h2>
          <div className="flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Verdict scores are heuristic estimates produced by a deterministic text-analysis model.
              They are not legal advice, financial advice, or trading recommendations. A high score
              does not guarantee correct or fair resolution. A low score does not mean a market will
              be resolved incorrectly.
            </p>
            <p>
              Verdict is not affiliated with, endorsed by, or in any commercial relationship with
              Polymarket or any other prediction market platform.
            </p>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
            >
              Open Dashboard
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
            >
              Read Methodology
            </Link>
            <Link
              href="/submit-dispute"
              className="inline-flex items-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
            >
              Submit a Dispute
            </Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
