'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface ShareButtonProps {
  question: string
}

export function ShareButton({ question }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that block clipboard without https
      const el = document.createElement('input')
      el.value = window.location.href
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 hover:border-foreground shrink-0"
      aria-label={`Copy link to: ${question}`}
      title="Copy link"
    >
      {copied ? (
        <>
          <Check className="size-3" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Link2 className="size-3" aria-hidden="true" />
          Copy Link
        </>
      )}
    </button>
  )
}
