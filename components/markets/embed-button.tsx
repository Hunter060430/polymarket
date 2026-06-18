'use client'

import { useState } from 'react'
import { Code, Check } from 'lucide-react'

interface EmbedButtonProps {
  marketId: string
}

export function EmbedButton({ marketId }: EmbedButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Built at click time so it uses the live origin (works in preview + prod).
  const snippet =
    typeof window !== 'undefined'
      ? `<iframe src="${window.location.origin}/embed/${marketId}" width="380" height="180" frameborder="0" title="Verdict clarity score"></iframe>`
      : ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet)
    } catch {
      const el = document.createElement('textarea')
      el.value = snippet
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 hover:border-foreground shrink-0"
        aria-expanded={open}
        aria-label="Get embed code"
        title="Embed this score"
      >
        <Code className="size-3" aria-hidden="true" />
        Embed
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 w-[min(90vw,420px)] border border-border bg-popover shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Embed code</p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
            >
              {copied ? (
                <>
                  <Check className="size-3" aria-hidden="true" /> Copied
                </>
              ) : (
                'Copy'
              )}
            </button>
          </div>
          <div className="px-4 py-3">
            <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
              {snippet}
            </pre>
          </div>
          <div className="px-4 py-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Paste anywhere HTML is allowed. The card updates automatically as the score changes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
