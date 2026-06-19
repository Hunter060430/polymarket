import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight, Shield, Clock, BookOpen, BarChart2, AlertTriangle, FileCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'

export const metadata: Metadata = {
  // Use layout.tsx default title — avoids "Verdict — Verdict" from the template
  title: null,
  description:
    'Independent scoring of Polymarket prediction markets. Know the resolution quality before you trade.',
}

// Compute live index stats from the cached market dataset. Falls back to safe
// placeholders if the data feed is unavailable so the homepage never errors.
async function getLiveStats() {
  try {
    const markets = await fetchAllActivePolymarketMarkets()
    const total = markets.length
    const critical = markets.filter((m) => m.score.riskLevel === 'Critical').length
    const highOrWorse = markets.filter(
      (m) => m.score.riskLevel === 'Critical' || m.score.riskLevel === 'High',
    ).length
    return [
      { value: total.toLocaleString('en-US'), label: 'Markets scanned' },
      { value: critical.toLocaleString('en-US'), label: 'Critical-risk markets' },
      { value: highOrWorse.toLocaleString('en-US'), label: 'High-risk or worse' },
      { value: '6', label: 'Scored dimensions' },
    ]
  } catch {
    return [
      { value: '8,000+', label: 'Markets scanned' },
      { value: '6', label: 'Scored dimensions' },
      { value: '0–100', label: 'Clarity score' },
      { value: '5 min', label: 'Cache refresh' },
    ]
  }
}

const FEATURES = [
  {
    icon: Clock,
    title: 'Time Clarity',
    desc: 'End date, timezone, and temporal constraint specificity — does the market tell you exactly when it resolves?',
  },
  {
    icon: BookOpen,
    title: 'Resolution Source',
    desc: 'Is the resolution authority named, institutional, and hierarchically specified? Or just "credible reporting"?',
  },
  {
    icon: FileCheck,
    title: 'Outcome Definition',
    desc: 'Is YES unambiguously defined? Binary outcomes with explicit criteria score highest.',
  },
  {
    icon: Shield,
    title: 'Evidence Standard',
    desc: 'Does the market specify accepted and excluded evidence? Ambiguity here is where disputes start.',
  },
  {
    icon: AlertTriangle,
    title: 'Edge Case Handling',
    desc: 'Delays, revisions, cancellations, late reporting — the markets that fail say nothing about these.',
  },
  {
    icon: BarChart2,
    title: 'Post-Trade Risk',
    desc: 'A composite of description depth, source completeness, and timing clarity. The overall structural risk.',
  },
]

const RISK_LEVELS = [
  { label: 'Low',      range: '80–100', color: 'var(--risk-low)',      note: 'Well-specified resolution criteria. Low dispute risk.' },
  { label: 'Medium',   range: '60–79',  color: 'var(--risk-medium)',   note: 'Some ambiguity. Review criteria before large positions.' },
  { label: 'High',     range: '40–59',  color: 'var(--risk-high)',     note: 'Significant concerns. Material dispute potential.' },
  { label: 'Critical', range: '0–39',   color: 'var(--risk-critical)', note: 'Substantially underspecified. High risk for all participants.' },
]

export default async function LandingPage() {
  const STATS = await getLiveStats()
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">

              {/* Left — headline */}
              <div className="py-20 lg:py-32 lg:pr-16 lg:border-r border-border">
                <div className="inline-flex items-center gap-3 mb-10">
                  <div className="h-px w-8 bg-primary" aria-hidden="true" />
                  <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium">
                    Independent Watchdog
                  </p>
                </div>
                <h1 className="font-heading text-[clamp(2.6rem,7vw,6.5rem)] font-light leading-[0.95] tracking-tight text-foreground text-balance mb-8">
                  Does this market<br />
                  have{' '}
                  <em className="not-italic text-primary">clear rules?</em>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mb-8">
                  Verdict scores every active Polymarket market across six dimensions of resolution
                  quality — in real time, before you trade. No black boxes. No discretion.
                  Deterministic, documented, and free.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
                  >
                    Open Dashboard
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/markets?sort=score-asc&risk=Critical"
                    className="inline-flex items-center justify-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
                  >
                    Critical Risk Markets
                  </Link>
                </div>
              </div>

              {/* Right — live stats */}
              <div className="hidden lg:flex flex-col justify-center pl-16 py-32">
                <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground mb-6">Live Index</p>
                <div className="divide-y divide-border border-t border-border">
                  {STATS.map((s) => (
                    <div key={s.label} className="py-6">
                      <p className="font-heading text-5xl font-light text-foreground tabular-nums leading-none">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-2 tracking-wide">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS MOBILE ─────────────────────────────────────── */}
        <section className="border-b border-border lg:hidden" aria-label="Key statistics">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground mb-5">Live Index</p>
            <div className="grid grid-cols-2 divide-x divide-y divide-border border border-border">
              {STATS.map((s) => (
                <div key={s.label} className="px-4 py-5">
                  <p className="font-heading text-3xl sm:text-4xl font-light text-foreground tabular-nums leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM STATEMENT ────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
              <div>
                <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-5">The Problem</p>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light text-foreground leading-tight">
                  Ambiguous rules are the source of every dispute.
                </h2>
              </div>
              <div className="flex flex-col gap-5 text-sm text-muted-foreground leading-relaxed justify-center">
                <p>
                  Prediction markets resolve based on the written criteria in a market's description.
                  When those criteria are vague, the resolution becomes a judgment call —
                  and judgment calls become disputes.
                </p>
                <p>
                  Verdict applies a deterministic, six-dimension ruleset to every active market and
                  produces a 0–100 clarity score before any money is at risk.
                </p>
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-primary hover:underline underline-offset-4 mt-1 self-start"
                >
                  Read the full methodology
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── SIX DIMENSIONS ───────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
            <div className="flex items-baseline justify-between gap-8 mb-8 sm:mb-12">
              <div>
                <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-4">Framework</p>
                <h2 className="font-heading text-3xl sm:text-4xl font-light text-foreground">Six dimensions. One score.</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border border-t border-l border-border">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="px-7 py-8 border-b border-r border-border">
                  <Icon className="size-5 text-primary mb-5 stroke-[1.25]" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground mb-2">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RISK SCALE ───────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 lg:gap-0">
              <div className="lg:pr-16 lg:border-r border-border">
                <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-5">Risk Scale</p>
                <h2 className="font-heading text-4xl font-light text-foreground leading-tight">
                  Four levels.<br />Instantly legible.
                </h2>
                <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
                  Every market gets a level. Critical means high dispute risk. Low means the rules are solid.
                </p>
              </div>
              <div className="lg:pl-16">
                <div className="divide-y divide-border">
                  {RISK_LEVELS.map((r) => (
                    <div key={r.label} className="flex items-start gap-6 py-7 first:pt-0 last:pb-0">
                      <div className="w-0.5 self-stretch shrink-0 mt-1" style={{ backgroundColor: r.color }} aria-hidden="true" />
                      <div className="w-28 shrink-0">
                        <p className="font-heading text-2xl font-light" style={{ color: r.color }}>{r.label}</p>
                        <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{r.range} pts</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{r.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-end">
              <div>
                <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light text-foreground leading-tight text-balance">
                  Start with the markets that matter most.
                </h2>
              </div>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Filter to Critical-risk markets — the lowest clarity scores, the highest potential for disputed resolutions.
                </p>
                <div className="flex flex-col gap-3 mt-2">
                  <Link
                    href="/markets?sort=score-asc&risk=Critical"
                    className="inline-flex items-center justify-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
                  >
                    View Critical-Risk Markets
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/submit-dispute"
                    className="inline-flex items-center justify-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
                  >
                    Report a Disputed Resolution
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors pt-1"
                  >
                    About Verdict
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <PageFooter />
    </div>
  )
}
