import { Nav, PageFooter } from '@/components/nav'
import Link from 'next/link'
import { ArrowRight, Search, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-20 flex flex-col justify-center">

        {/* Large 404 watermark + headline */}
        <div className="border-b border-border pb-10 mb-10">
          <p
            className="font-heading font-light text-foreground/[0.06] leading-none select-none"
            style={{ fontSize: 'clamp(6rem,22vw,14rem)' }}
            aria-hidden="true"
          >
            404
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-light text-foreground -mt-4 sm:-mt-8 mb-4">
            Nothing to score here.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            The market or page you are looking for does not exist, may have already resolved, or the
            URL is incorrect. Verdict only tracks active and recently resolved Polymarket markets.
          </p>
        </div>

        {/* Navigation shortcuts */}
        <nav className="flex flex-col sm:flex-row gap-2.5 mb-12" aria-label="Recovery navigation">
          <Link
            href="/markets"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
          >
            <Search className="size-3.5" aria-hidden="true" />
            Browse Markets
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
          >
            Dashboard
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/markets/resolved"
            className="inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-6 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary hover:text-foreground transition-colors"
          >
            Resolved Markets
          </Link>
        </nav>

        {/* Brand CTA */}
        <div className="border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">Witnessed an unfair resolution?</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Verdict is building a public archive of disputed Polymarket settlements.
                Submit a case and help hold the platform accountable.
              </p>
            </div>
          </div>
          <Link
            href="/submit-dispute"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 whitespace-nowrap"
          >
            Submit a Case
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>

      </main>
      <PageFooter />
    </div>
  )
}
