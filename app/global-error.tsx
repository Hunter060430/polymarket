'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background text-foreground">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Unexpected error</p>
          <h1 className="font-heading text-4xl font-light text-balance">Verdict could not load this view.</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">The error has been recorded. Retry now, or use the feedback control after the page recovers.</p>
          <button onClick={reset} className="bg-foreground px-5 py-2.5 text-sm text-background">Try again</button>
        </main>
      </body>
    </html>
  )
}
