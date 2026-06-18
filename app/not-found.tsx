import { Nav, PageFooter } from '@/components/nav'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-24 flex flex-col justify-center">
        <div className="border-b border-border pb-12 mb-12">
          <p className="font-heading text-[clamp(5rem,20vw,12rem)] font-light text-foreground/10 leading-none select-none" aria-hidden="true">
            404
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-light text-foreground -mt-4 sm:-mt-6">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-md">
            The market or page you are looking for does not exist, may have been resolved, or the URL may be incorrect.
          </p>
        </div>

        <nav className="flex flex-col sm:flex-row gap-3" aria-label="Recovery navigation">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
          >
            Open Dashboard
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/markets"
            className="inline-flex items-center justify-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
          >
            Browse Markets
          </Link>
          <Link
            href="/markets/resolved"
            className="inline-flex items-center justify-center gap-2.5 border border-border text-muted-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary hover:text-foreground transition-colors"
          >
            Resolved Markets
          </Link>
        </nav>
      </main>
      <PageFooter />
    </div>
  )
}
