'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <p className="text-xs uppercase tracking-[0.12em] text-destructive">Page Error</p>
      <h1 className="text-3xl font-light text-foreground max-w-sm">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        An error occurred while loading this page. The error has been recorded and our team is aware.
      </p>
      {error.digest && <p className="text-xs text-muted-foreground/50 font-mono">ref: {error.digest}</p>}
      <button
        onClick={() => reset()}
        className="bg-foreground text-background px-5 py-2.5 text-xs tracking-[0.12em] uppercase font-medium hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </main>
  )
}
