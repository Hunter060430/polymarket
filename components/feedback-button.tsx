'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('feedback')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('sending')
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, message, pageUrl: window.location.href }) })
    if (!response.ok) return setStatus('error')
    setMessage('')
    setStatus('sent')
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] border border-border bg-background p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-medium">Send feedback</p><p className="mt-1 text-xs text-muted-foreground">Report a bug, incorrect market data, or an idea.</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close feedback form" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <label className="text-xs text-muted-foreground">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 h-9 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="feedback">Product feedback</option><option value="bug">Bug report</option><option value="data">Incorrect data</option></select></label>
            <label className="text-xs text-muted-foreground">Details<textarea required minLength={10} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-1.5 w-full resize-none border border-border bg-background p-3 text-sm text-foreground" placeholder="What happened, and what did you expect?" /></label>
            {status === 'sent' && <p className="text-xs text-primary" role="status">Feedback received. Thank you.</p>}
            {status === 'error' && <p className="text-xs text-destructive" role="alert">Could not send feedback. Please retry.</p>}
            <button disabled={status === 'sending'} className="bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">{status === 'sending' ? 'Sending…' : 'Send feedback'}</button>
          </form>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Send feedback" className="ml-auto flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg"><MessageSquare className="size-4" /></button>
    </div>
  )
}
