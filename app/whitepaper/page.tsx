import Link from 'next/link'
import { Download, FileText, ExternalLink } from 'lucide-react'
import { Nav, PageFooter } from '@/components/nav'

export const metadata = {
  title: 'Whitepaper — Verdict',
  description:
    'The Verdict Whitepaper describes the resolution risk framework, six-dimension scoring methodology, platform architecture, and known limitations. Version 1.0, June 2026.',
}

const SECTIONS = [
  { num: '1', title: 'Abstract' },
  { num: '2', title: 'Introduction — The Problem with Prediction Market Resolution' },
  { num: '3', title: 'What is Verdict?' },
  { num: '4', title: 'The Resolution Risk Framework' },
  { num: '5', title: 'Scoring Methodology' },
  { num: '6', title: 'Risk Level Classification' },
  { num: '7', title: 'Platform Architecture and Features' },
  { num: '8', title: 'Community and Governance Layer' },
  { num: '9', title: 'Data Sources and Refresh Policy' },
  { num: '10', title: 'Limitations and Future Work' },
  { num: '11', title: 'Conclusion' },
  { num: '12', title: 'Appendix — Full Scoring Ruleset Reference Table' },
]

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1">

        {/* Hero */}
        <section className="border-b border-border bg-secondary/10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20">
            <p className="text-xs tracking-[0.14em] uppercase text-muted-foreground mb-4">
              Technical Document
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-light tracking-wide text-foreground mb-4 text-balance">
              Verdict Whitepaper
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-2 text-pretty">
              An independent watchdog for prediction market resolution quality.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              Version 1.0 &mdash; June 2026 &mdash; Prepared for researchers, institutional traders, and platform developers.
            </p>

            {/* Download button */}
            <a
              href="/verdict-whitepaper-v1.pdf"
              download="Verdict-Whitepaper-v1.pdf"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-sm hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" aria-hidden="true" />
              Download PDF
            </a>
            <a
              href="/verdict-whitepaper-v1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 ml-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              View in browser
            </a>
          </div>
        </section>

        {/* Document info + TOC */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            <div className="sm:col-span-2">
              <h2 className="text-xs tracking-[0.12em] uppercase text-foreground font-medium mb-4">Document Scope</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This document describes the current Verdict product, its scoring methodology, platform
                architecture, and known limitations. It is a technical whitepaper and does not constitute
                legal, financial, investment, or trading advice.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                The methodology applies to active, non-closed Polymarket markets with non-zero trading
                volume retrieved through the public Polymarket Gamma API and processed under the current
                Verdict ruleset.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Version</p>
                <p className="text-sm text-foreground font-medium">1.0</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Published</p>
                <p className="text-sm text-foreground font-medium">June 2026</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pages</p>
                <p className="text-sm text-foreground font-medium">12</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Format</p>
                <p className="text-sm text-foreground font-medium">PDF (LaTeX)</p>
              </div>
            </div>
          </div>

          {/* Table of contents */}
          <div className="border border-border rounded-sm">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-xs tracking-[0.12em] uppercase text-foreground font-medium">Table of Contents</h2>
            </div>
            <ol className="divide-y divide-border">
              {SECTIONS.map((s) => (
                <li key={s.num} className="flex items-baseline gap-3 px-5 py-3">
                  <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">{s.num}.</span>
                  <span className="text-sm text-foreground">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href="/verdict-whitepaper-v1.pdf"
              download="Verdict-Whitepaper-v1.pdf"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-sm hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" aria-hidden="true" />
              Download PDF
            </a>
            <span className="text-xs text-muted-foreground">
              Free to share under the{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Verdict Terms
              </Link>
              . Please attribute the source.
            </span>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
