'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'verdict:cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, [])

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, 'accepted') } catch {}
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem(CONSENT_KEY, 'declined') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="glass fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-50 rounded-2xl border border-border shadow-xl px-4 py-4 sm:px-5 reveal"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
          We use essential cookies to keep you signed in and remember your preferences.{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="rounded-full px-4 py-2 text-xs text-muted-foreground border border-border hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-full px-4 py-2 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
