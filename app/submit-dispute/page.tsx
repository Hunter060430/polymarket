import Link from 'next/link'
import { Nav, PageFooter } from '@/components/nav'
import { ArrowRight, FileText, ShieldCheck, FolderArchive, Megaphone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Report a Disputed Resolution',
  description:
    'The Verdict dispute archive is in active development — a public, structured record of unfair or controversial prediction market resolutions.',
}

const PLANNED = [
  {
    icon: FileText,
    title: 'Submit your case',
    desc: 'A structured form to document a disputed resolution — the market, the rules as written, what actually happened, and why you believe it was unfair.',
  },
  {
    icon: ShieldCheck,
    title: 'Preserve evidence',
    desc: 'Attach screenshots, links, and timestamps so the record is preserved even if the original market page changes or disappears.',
  },
  {
    icon: FolderArchive,
    title: 'Public case archive',
    desc: 'Anonymized, reviewed cases published as a searchable archive — building the first public database of disputed prediction market resolutions.',
  },
  {
    icon: Megaphone,
    title: 'Generate case cards',
    desc: 'Shareable, citable case cards that summarize each dispute, so affected users have a voice when platforms fail to listen.',
  },
]

export default function SubmitDisputePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 flex flex-col gap-0">

        {/* ── Page header ───────────────────────────────── */}
        <div className="border-b border-border pb-10 mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-primary" aria-hidden="true" />
            <p className="text-xs tracking-[0.2em] uppercase text-primary">In Development</p>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-tight text-balance">
            Report a disputed resolution
          </h1>
          <p className="text-lg text-muted-foreground mt-5 leading-relaxed font-heading font-light max-w-2xl text-pretty">
            We are building a public, structured archive of unfair and controversial prediction
            market resolutions. The submission tool is not live yet — here is what is coming.
          </p>
        </div>

        {/* ── What's coming ─────────────────────────────── */}
        <section className="mb-12">
          <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-8">What we are building</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-border border-t border-l border-border">
            {PLANNED.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="px-7 py-8 border-b border-r border-border">
                <Icon className="size-5 text-primary mb-5 stroke-[1.25]" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground mb-2">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Notice ────────────────────────────────────── */}
        <section className="border-l-2 border-primary pl-5 py-1 mb-12">
          <p className="text-sm text-foreground leading-relaxed max-w-2xl">
            Verdict is a non-profit, public-interest project. The archive exists to document disputes
            and push the industry toward fairer standards — never to encourage harassment or abuse.
            Submissions will be reviewed before publication, and cases may be anonymized.
          </p>
        </section>

        {/* ── Follow for updates ────────────────────────── */}
        <section className="border-t border-border pt-12">
          <h2 className="font-heading text-2xl font-light text-foreground mb-3">Want to know when it launches?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-6">
            Follow Verdict on X for launch updates. In the meantime, you can explore the markets most
            likely to produce disputes — the lowest clarity scores on the index.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://x.com/GetVerdictHQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow @GetVerdictHQ
            </a>
            <Link
              href="/markets?sort=score-asc&risk=Critical"
              className="inline-flex items-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
            >
              View Critical-Risk Markets
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
