'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#0a0a0a', color: '#f5f5f5' }}>
        <main style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888' }}>Unexpected error</p>
          <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#f5f5f5' }}>Verdict could not load.</h1>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#999', maxWidth: '400px' }}>The error has been recorded. Refresh the page to retry.</p>
          {error.digest && <p style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace', marginTop: '12px' }}>ref: {error.digest}</p>}
          <button onClick={() => reset()} style={{ background: '#f5f5f5', color: '#0a0a0a', padding: '10px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, border: 'none', cursor: 'pointer', marginTop: '12px' }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>Try Again</button>
        </main>
      </body>
    </html>
  )
}
