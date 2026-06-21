'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

// X/Twitter bird SVG
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3 fill-current shrink-0" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface ShareButtonProps {
  question: string
  score?: number
  riskLevel?: string
}

export function ShareButton({ question, score, riskLevel }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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

  function handleTwitterShare() {
    const url = window.location.href
    const scoreText = score !== undefined ? ` — Verdict score ${score}/100` : ''
    const riskText = riskLevel ? ` (${riskLevel} Risk)` : ''
    const text = `${question}${scoreText}${riskText}\n\nChecked on @GetVerdictHQ`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 hover:border-foreground"
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
            Copy
          </>
        )}
      </button>

      {/* Share on X */}
      <button
        onClick={handleTwitterShare}
        className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 hover:border-foreground"
        aria-label={`Share on X: ${question}`}
        title="Share on X"
      >
        <XIcon />
        Share
      </button>
    </div>
  )
}
