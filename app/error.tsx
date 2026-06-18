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
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-24 flex flex-col justify-center">
        <div className="border-b border-border pb-12 mb-12">
          <p className="text-xs tracking-[0.16em] uppercase text-destructive mb-4">Error</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-light text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-md">
            Verdict encountered an unexpected error. This is usually a temporary issue with the
            Polymarket data feed. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2.5 bg-foreground text-background px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 border border-border text-foreground px-7 py-3.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors"
          >
            Go Home
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
