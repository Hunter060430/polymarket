'use client'

import { Nav, PageFooter } from '@/components/nav'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[verdict] unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-20 flex flex-col justify-center">

        <div className="border-b border-border pb-10 mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-destructive mb-5">System Error</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-light text-foreground mb-4">
            The data feed stumbled.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Verdict pulls live data from the Polymarket Gamma API. Occasionally the feed returns
            an unexpected response — this is almost always temporary. Retry below or return to the
            dashboard while we recover.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 mt-4 font-mono tracking-wide">
              ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mb-12">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
          >
            Dashboard
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/markets"
            className="inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-6 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary hover:text-foreground transition-colors"
          >
            Browse Markets
          </Link>
        </div>

        {/* Verdict mission note */}
        <div className="border-l-2 border-primary pl-5">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
            Verdict is an independent watchdog for Polymarket resolution quality. Founded by Hunter Guo,
            we score every active market on clarity before any money is at risk. No token. No commercial
            relationship with Polymarket.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline underline-offset-4"
          >
            About Verdict
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>

      </main>
      <PageFooter />
    </div>
  )
}
