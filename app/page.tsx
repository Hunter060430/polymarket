import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight } from 'lucide-react'

const STATS = [
  { value: '200+', label: 'Active markets scanned' },
  { value: '6',    label: 'Scored criteria' },
  { value: '0–100', label: 'Clarity score range' },
  { value: '5 min', label: 'Cache revalidation' },
]

const CRITERIA = [
  { num: '01', name: 'Time Clarity',       desc: 'End date, timezone, and temporal constraint specificity.' },
  { num: '02', name: 'Resolution Source',  desc: 'Named, authoritative, and hierarchically structured sources.' },
  { num: '03', name: 'Outcome Definition', desc: 'Concise question, binary outcomes, explicit YES definition.' },
  { num: '04', name: 'Evidence Standard',  desc: 'Accepted and excluded evidence types are defined.' },
  { num: '05', name: 'Edge Case Handling', desc: 'Delays, revisions, cancellations, and late reporting addressed.' },
  { num: '06', name: 'Post-Trade Risk',    desc: 'Description depth, source completeness, timing constraints.' },
]

const RISK_LEVELS = [
  { label: 'Low',      range: '80–100', color: 'var(--risk-low)',      note: 'Well-specified, low dispute risk.' },
  { label: 'Medium',   range: '60–79',  color: 'var(--risk-medium)',   note: 'Some ambiguity. Review before large positions.' },
  { label: 'High',     range: '40–59',  color: 'var(--risk-high)',     note: 'Significant concerns. Material dispute potential.' },
  { label: 'Critical', range: '0–39',   color: 'var(--risk-critical)', note: 'Substantially underspecified. High risk.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-0">
              {/* Left — headline */}
              <div className="py-20 lg:py-28 lg:pr-16 lg:border-r border-border">
                <p className="text-xs tracking-[0.18em] uppercase text-primary mb-8 font-medium">
                  Independent Watchdog &mdash; Polymarket
                </p>
                <h1 className="font-heading text-6xl sm:text-7xl lg:text-8xl font-light leading-[0.96] tracking-tight text-foreground text-balance mb-8">
                  Prediction<br />
                  markets deserve<br />
                  <em className="not-italic text-primary">clear rules.</em>
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-10">
                  The Rule Clarity Index scans active Polymarket markets in real time and scores each one across six dimensions of resolution quality — before you trade.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3 text-xs tracking-[0.1em] uppercase font-medium hover:bg-primary transition-colors"
                  >
                    Open Dashboard
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/markets"
                    className="inline-flex items-center gap-2.5 border border-border text-foreground px-6 py-3 text-xs tracking-[0.1em] uppercase font-medium hover:bg-secondary transition-colors"
                  >
                    Browse Markets
                  </Link>
                </div>
              </div>

              {/* Right — stats */}
              <div className="hidden lg:flex flex-col justify-center gap-0 pl-16 py-28">
                {STATS.map((s) => (
                  <div key={s.label} className="py-5 border-b border-border last:border-b-0 first:border-t border-border">
                    <p className="font-heading text-4xl font-light text-foreground tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS MOBILE ─────────────────────────────────────── */}
        <section className="border-b border-border lg:hidden" aria-label="Key statistics">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border border border-border">
              {STATS.map((s) => (
                <div key={s.label} className="px-5 py-5">
                  <p className="font-heading text-3xl font-light text-foreground tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-0">
              <div className="lg:pr-12 lg:border-r border-border">
                <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-4">Framework</p>
                <h2 className="font-heading text-4xl font-light text-foreground leading-tight">
                  Six criteria.<br />One score.
                </h2>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  Each market is evaluated against a deterministic, publicly documented ruleset. No black boxes. No discretion.
                </p>
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-2 mt-6 text-xs tracking-[0.08em] uppercase text-primary hover:underline underline-offset-4"
                >
                  Read full methodology
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
              <div className="lg:pl-12">
                <div className="divide-y divide-border">
                  {CRITERIA.map((c) => (
                    <div key={c.num} className="flex items-start gap-6 py-5 first:pt-0 last:pb-0">
                      <span className="font-heading text-xs text-muted-foreground tabular-nums mt-0.5 w-5 shrink-0">{c.num}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── RISK LEVELS ──────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-0">
              <div className="lg:pr-12 lg:border-r border-border">
                <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-4">Risk Scale</p>
                <h2 className="font-heading text-4xl font-light text-foreground leading-tight">
                  Four levels of clarity risk.
                </h2>
              </div>
              <div className="lg:pl-12">
                <div className="divide-y divide-border">
                  {RISK_LEVELS.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center gap-6 py-5 first:pt-0 last:pb-0"
                    >
                      <div className="w-1 self-stretch shrink-0" style={{ backgroundColor: r.color }} aria-hidden="true" />
                      <div className="w-24 shrink-0">
                        <p className="text-sm font-medium" style={{ color: r.color }}>{r.label}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{r.range} pts</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
            <div className="max-w-lg">
              <h2 className="font-heading text-5xl font-light text-foreground leading-tight">
                Start with the markets that matter most.
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Filtered to Critical-risk markets — the lowest clarity scores, the highest dispute potential.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link
                href="/markets?sort=score-asc&risk=Critical"
                className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3 text-xs tracking-[0.1em] uppercase font-medium hover:bg-primary transition-colors"
              >
                View Critical-Risk Markets
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/submit-dispute"
                className="inline-flex items-center gap-2.5 border border-border text-foreground px-6 py-3 text-xs tracking-[0.1em] uppercase font-medium hover:bg-secondary transition-colors"
              >
                Submit a Disputed Resolution
              </Link>
            </div>
          </div>
        </section>

      </main>

      <PageFooter />
    </div>
  )
}
