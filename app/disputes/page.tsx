import { Nav, PageFooter } from '@/components/nav'
import { RiskBadge } from '@/components/risk-badge'
import Link from 'next/link'
import { ArrowRight, ExternalLink, FileWarning, CheckCircle2, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dispute Registry',
  description:
    'A public registry of submitted resolution disputes on Polymarket markets, documented by Verdict for independent analysis.',
}

type DisputeStatus = 'Under Review' | 'Confirmed' | 'Dismissed'

interface DisputeCase {
  id: string
  date: string
  marketTitle: string
  marketUrl: string
  platform: string
  status: DisputeStatus
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low'
  summary: string
  clarityScore: number
}

// Curated example cases — represent the type of disputes Verdict tracks.
// Real cases submitted via /submit-dispute are reviewed before publication.
const CASES: DisputeCase[] = [
  {
    id: 'VRD-2025-001',
    date: 'Jun 12, 2025',
    marketTitle: 'Will X event happen before end of Q2 2025?',
    marketUrl: 'https://polymarket.com',
    platform: 'Polymarket',
    status: 'Under Review',
    riskLevel: 'Critical',
    clarityScore: 31,
    summary:
      'Market resolved NO despite the underlying event occurring on the final day of the resolution window. Resolution criteria did not specify whether the end date was inclusive or exclusive.',
  },
  {
    id: 'VRD-2025-002',
    date: 'May 28, 2025',
    marketTitle: 'Will the official announcement be made by [Agency]?',
    marketUrl: 'https://polymarket.com',
    platform: 'Polymarket',
    status: 'Confirmed',
    riskLevel: 'High',
    clarityScore: 44,
    summary:
      'Resolution source was listed as "official government announcement" without specifying a URL, press release type, or channel. Resolver used an unofficial tweet. Verdict confirms ambiguity in original rule text.',
  },
  {
    id: 'VRD-2025-003',
    date: 'May 10, 2025',
    marketTitle: 'Will GDP exceed the target figure in the reported period?',
    marketUrl: 'https://polymarket.com',
    platform: 'Polymarket',
    status: 'Dismissed',
    riskLevel: 'Medium',
    clarityScore: 58,
    summary:
      'Submitter claimed the revised GDP figure should have been used. Resolution criteria explicitly stated "initial release figure." Verdict finds resolution consistent with stated criteria. Case dismissed.',
  },
]

const STATUS_META: Record<DisputeStatus, { icon: React.ReactNode; color: string; label: string }> = {
  'Under Review': {
    icon: <Clock className="size-3.5" aria-hidden="true" />,
    color: 'var(--risk-high)',
    label: 'Under Review',
  },
  Confirmed: {
    icon: <FileWarning className="size-3.5" aria-hidden="true" />,
    color: 'var(--risk-critical)',
    label: 'Confirmed',
  },
  Dismissed: {
    icon: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
    color: 'var(--risk-low)',
    label: 'Dismissed',
  },
}

export default function DisputesPage() {
  const counts = {
    total:       CASES.length,
    underReview: CASES.filter((c) => c.status === 'Under Review').length,
    confirmed:   CASES.filter((c) => c.status === 'Confirmed').length,
    dismissed:   CASES.filter((c) => c.status === 'Dismissed').length,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="border-b border-border pb-8 mb-10">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Community Registry</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-foreground">
            Dispute Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xl">
            A public log of resolution disputes submitted to Verdict. Each case is reviewed against
            the market&apos;s original resolution criteria before publication. Submitted cases are
            anonymised unless the submitter opts in to attribution.
          </p>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border border-border mt-6">
            {[
              { label: 'Total cases',   value: counts.total       },
              { label: 'Under review',  value: counts.underReview },
              { label: 'Confirmed',     value: counts.confirmed   },
              { label: 'Dismissed',     value: counts.dismissed   },
            ].map((s) => (
              <div key={s.label} className="px-4 sm:px-5 py-4">
                <p className="font-heading text-3xl font-light tabular-nums text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Process note */}
        <div className="border border-border px-5 py-4 mb-10 flex gap-4">
          <FileWarning className="size-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Review process</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cases are published only after manual review against original market rule text. Status
              transitions: <strong>Submitted → Under Review → Confirmed</strong> (ambiguity confirmed)
              or <strong>Dismissed</strong> (resolution consistent with criteria). This registry is
              for documentation purposes only and does not constitute legal or financial advice.
            </p>
          </div>
        </div>

        {/* Case list */}
        <div className="flex flex-col border border-border divide-y divide-border mb-10">
          {CASES.map((c) => {
            const meta = STATUS_META[c.status]
            return (
              <div key={c.id} className="px-5 py-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground font-mono">{c.id}</span>
                    <span className="text-[10px] text-muted-foreground">{c.date}</span>
                    <RiskBadge level={c.riskLevel} />
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase border px-2 py-0.5"
                    style={{ color: meta.color, borderColor: meta.color }}
                  >
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>

                <div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug flex-1">{c.marketTitle}</p>
                    <a
                      href={c.marketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="View on Polymarket"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform: {c.platform} &middot; Verdict Clarity Score at submission: {c.clarityScore}/100
                  </p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{c.summary}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Experienced a disputed resolution?</p>
            <p className="text-xs text-muted-foreground mt-1">Submit a case for independent documentation and review.</p>
          </div>
          <Link
            href="/submit-dispute"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-xs tracking-[0.1em] uppercase hover:bg-primary transition-colors shrink-0"
          >
            Submit a Dispute
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

      </main>
      <PageFooter />
    </div>
  )
}
