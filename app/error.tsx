'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '16px', textAlign: 'center', background: '#0a0a0a', color: '#f5f5f5', maxWidth: '560px', margin: '0 auto' }}>
      <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ef4444', margin: 0 }}>Page Error</p>
      <h1 style={{ fontSize: '28px', fontWeight: 300, color: '#f5f5f5', margin: '0 0 8px 0', maxWidth: '420px' }}>Something went wrong</h1>
      <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#999', margin: 0, maxWidth: '400px' }}>
        An error occurred while loading this page. The error has been recorded and our team is aware.
      </p>
      {error.digest && <p style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace', margin: '8px 0 0 0' }}>ref: {error.digest}</p>}
      <button
        onClick={() => reset()}
        style={{ background: '#f5f5f5', color: '#0a0a0a', padding: '10px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, border: 'none', cursor: 'pointer', marginTop: '12px' }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Try Again
      </button>
    </main>
  )
}
