'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-foreground mb-1 block"
    >
      {children}
      {required && <span className="text-destructive ml-0.5" aria-hidden="true"> *</span>}
    </label>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{children}</p>
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
    // Simulated submission — in production connect to a backend or form service
    await new Promise((r) => setTimeout(r, 1200))
    setState('success')
  }

  if (state === 'success') {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <CheckCircle className="size-10 text-[var(--risk-low)]" aria-hidden="true" />
          <p className="text-base font-semibold text-foreground">Submission received</p>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Thank you for your report. Your submission has been logged for review. If you provided a contact, we may follow up for additional information.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => { setForm(INITIAL); setState('idle') }}
          >
            Submit another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Platform */}
          <div>
            <FieldLabel htmlFor="platform" required>Platform</FieldLabel>
            <Select value={form.platform} onValueChange={(v) => v && set('platform', v)}>
              <SelectTrigger id="platform" aria-required="true">
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
          </div>

          {/* Market URL */}
          <div>
            <FieldLabel htmlFor="marketUrl" required>Market URL</FieldLabel>
            <Input
              id="marketUrl"
              type="url"
              placeholder="https://polymarket.com/market/..."
              value={form.marketUrl}
              onChange={(e) => set('marketUrl', e.target.value)}
              aria-required="true"
            />
          </div>

          {/* Market Title */}
          <div>
            <FieldLabel htmlFor="marketTitle" required>Market Title / Question</FieldLabel>
            <Input
              id="marketTitle"
              placeholder="As it appears on the platform"
              value={form.marketTitle}
              onChange={(e) => set('marketTitle', e.target.value)}
              aria-required="true"
            />
          </div>

          <Separator />

          {/* Position */}
          <div>
            <FieldLabel htmlFor="position">Your Position</FieldLabel>
            <Select value={form.position} onValueChange={(v) => v && set('position', v)}>
              <SelectTrigger id="position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES">YES</SelectItem>
                <SelectItem value="NO">NO</SelectItem>
                <SelectItem value="Multiple">Multiple positions</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Loss */}
          <div>
            <FieldLabel htmlFor="estimatedLoss">Estimated Loss (USD)</FieldLabel>
            <Input
              id="estimatedLoss"
              type="text"
              placeholder="e.g. 500"
              value={form.estimatedLoss}
              onChange={(e) => set('estimatedLoss', e.target.value)}
            />
            <FieldHint>Approximate value only. Used for aggregating impact data, not for legal purposes.</FieldHint>
          </div>

          <Separator />

          {/* What happened */}
          <div>
            <FieldLabel htmlFor="whatHappened" required>What Happened</FieldLabel>
            <Textarea
              id="whatHappened"
              placeholder="Describe the resolution dispute in detail. What did the resolution criteria state? How was the market actually resolved? Why do you believe this was inconsistent?"
              className="min-h-[120px] leading-relaxed"
              value={form.whatHappened}
              onChange={(e) => set('whatHappened', e.target.value)}
              aria-required="true"
            />
            <FieldHint>
              Use specific language. Reference exact wording from the market description where possible.
            </FieldHint>
          </div>

          {/* Evidence */}
          <div>
            <FieldLabel htmlFor="evidenceLinks">Evidence Links</FieldLabel>
            <Textarea
              id="evidenceLinks"
              placeholder="One URL per line. Link to screenshots, official sources, filings, or other supporting documentation."
              className="min-h-[80px]"
              value={form.evidenceLinks}
              onChange={(e) => set('evidenceLinks', e.target.value)}
            />
          </div>

          <Separator />

          {/* Contact */}
          <div>
            <FieldLabel htmlFor="contact">Contact (optional)</FieldLabel>
            <Input
              id="contact"
              type="text"
              placeholder="Email address or X (Twitter) handle"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
            />
            <FieldHint>Used only for follow-up. Not published without your consent.</FieldHint>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3">
            <input
              id="consent"
              type="checkbox"
              className="mt-0.5 size-4 rounded border-border"
              checked={form.consentPublish}
              onChange={(e) => set('consentPublish', e.target.checked)}
              aria-describedby="consent-desc"
            />
            <div>
              <label htmlFor="consent" className="text-xs font-medium text-foreground cursor-pointer">
                I consent to publication of an anonymized version of this case
              </label>
              <p id="consent-desc" className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Anonymized cases may be published to document patterns of disputed resolution in the public interest. Personal identifying information is never published.
              </p>
            </div>
          </div>

          {state === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">
                Submission failed. Please try again or contact us directly.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={state === 'submitting' || !form.platform || !form.marketUrl || !form.marketTitle || !form.whatHappened}
            className="w-full"
          >
            {state === 'submitting' ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" data-icon="inline-start" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit Dispute Report'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            This submission is for documentation and independent analysis only. It does not initiate any legal or platform action.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
