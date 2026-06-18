'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface FormData {
  platform: string
  marketUrl: string
  marketTitle: string
  position: string
  estimatedLoss: string
  whatHappened: string
  evidenceLinks: string
  contact: string
  consentPublish: boolean
}

const INITIAL: FormData = {
  platform: '',
  marketUrl: '',
  marketTitle: '',
  position: '',
  estimatedLoss: '',
  whatHappened: '',
  evidenceLinks: '',
  contact: '',
  consentPublish: false,
}

function Field({
  htmlFor,
  label,
  hint,
  required,
  children,
}: {
  htmlFor: string
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-3 sm:gap-6 py-6 border-b border-border first:border-t first:border-border">
      <div>
        <label htmlFor={htmlFor} className="text-xs tracking-[0.08em] uppercase text-foreground block">
          {label}
          {required && <span className="text-destructive ml-0.5" aria-hidden="true"> *</span>}
        </label>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function DisputeForm() {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [state, setState] = useState<FormState>('idle')

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[verdict] dispute submit failed:', res.status, data)
        setState('error')
        return
      }
      setState('success')
    } catch (err) {
      console.error('[verdict] dispute submit error:', err)
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="border border-border px-8 py-16 flex flex-col items-center text-center gap-4">
        <CheckCircle className="size-10 text-[var(--risk-low)]" aria-hidden="true" />
        <p className="font-heading text-2xl font-light text-foreground">Submission received</p>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Your report has been logged for review. If you provided a contact address, we may
          follow up for additional information.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => { setForm(INITIAL); setState('idle') }}
        >
          Submit another
        </Button>
      </div>
    )
  }

  const canSubmit =
    state !== 'submitting' &&
    !!form.platform &&
    !!form.marketUrl &&
    !!form.marketTitle &&
    !!form.whatHappened

  return (
    <form onSubmit={handleSubmit} noValidate>

      <Field htmlFor="platform" label="Platform" required>
        <Select value={form.platform} onValueChange={(v) => v && set('platform', v)}>
          <SelectTrigger id="platform" aria-required="true" className="bg-background">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Polymarket">Polymarket</SelectItem>
            <SelectItem value="Manifold">Manifold</SelectItem>
            <SelectItem value="Kalshi">Kalshi</SelectItem>
            <SelectItem value="Augur">Augur</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field htmlFor="marketUrl" label="Market URL" required>
        <Input
          id="marketUrl"
          type="url"
          placeholder="https://polymarket.com/market/..."
          value={form.marketUrl}
          onChange={(e) => set('marketUrl', e.target.value)}
          aria-required="true"
          className="bg-background"
        />
      </Field>

      <Field htmlFor="marketTitle" label="Market Title" required>
        <Input
          id="marketTitle"
          placeholder="As it appears on the platform"
          value={form.marketTitle}
          onChange={(e) => set('marketTitle', e.target.value)}
          aria-required="true"
          className="bg-background"
        />
      </Field>

      <Field htmlFor="position" label="Your Position">
        <Select value={form.position} onValueChange={(v) => v && set('position', v)}>
          <SelectTrigger id="position" className="bg-background">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YES">YES</SelectItem>
            <SelectItem value="NO">NO</SelectItem>
            <SelectItem value="Multiple">Multiple positions</SelectItem>
            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field
        htmlFor="estimatedLoss"
        label="Estimated Loss"
        hint="Approximate USD value only. Used for aggregating impact data, not for legal purposes."
      >
        <Input
          id="estimatedLoss"
          type="text"
          placeholder="e.g. 500"
          value={form.estimatedLoss}
          onChange={(e) => set('estimatedLoss', e.target.value)}
          className="bg-background"
        />
      </Field>

      <Field
        htmlFor="whatHappened"
        label="What Happened"
        required
        hint="Use specific language. Reference exact wording from the market description where possible."
      >
        <Textarea
          id="whatHappened"
          placeholder="Describe the resolution dispute in detail. What did the resolution criteria state? How was the market actually resolved? Why do you believe this was inconsistent?"
          className="min-h-[140px] leading-relaxed bg-background"
          value={form.whatHappened}
          onChange={(e) => set('whatHappened', e.target.value)}
          aria-required="true"
        />
      </Field>

      <Field
        htmlFor="evidenceLinks"
        label="Evidence Links"
        hint="One URL per line. Screenshots, official sources, filings, or supporting documentation."
      >
        <Textarea
          id="evidenceLinks"
          placeholder="https://..."
          className="min-h-[80px] bg-background"
          value={form.evidenceLinks}
          onChange={(e) => set('evidenceLinks', e.target.value)}
        />
      </Field>

      <Field
        htmlFor="contact"
        label="Contact"
        hint="Used only for follow-up. Not published without your consent."
      >
        <Input
          id="contact"
          type="text"
          placeholder="Email address or X handle"
          value={form.contact}
          onChange={(e) => set('contact', e.target.value)}
          className="bg-background"
        />
      </Field>

      {/* Consent */}
      <div className="py-6 border-b border-border flex items-start gap-4">
        <input
          id="consent"
          type="checkbox"
          className="mt-0.5 size-4 border-border shrink-0 accent-[var(--primary)]"
          checked={form.consentPublish}
          onChange={(e) => set('consentPublish', e.target.checked)}
          aria-describedby="consent-desc"
        />
        <div>
          <label htmlFor="consent" className="text-xs tracking-[0.06em] uppercase text-foreground cursor-pointer">
            I consent to anonymized publication
          </label>
          <p id="consent-desc" className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Anonymized cases may be published to document patterns of disputed resolution.
            Personal identifying information is never published.
          </p>
        </div>
      </div>

      {/* Error */}
      {state === 'error' && (
        <div className="flex items-center gap-3 text-sm border border-destructive/40 px-5 py-4 text-destructive mt-6">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          Submission failed. Please try again.
        </div>
      )}

      {/* Submit */}
      <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
          Documentation and independent analysis only. No legal or platform action is initiated.
        </p>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="shrink-0 bg-foreground text-background hover:bg-primary transition-colors px-8 py-3 text-xs tracking-[0.1em] uppercase h-auto"
        >
          {state === 'submitting' ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
              Submitting
            </>
          ) : (
            'Submit Report'
          )}
        </Button>
      </div>

    </form>
  )
}
