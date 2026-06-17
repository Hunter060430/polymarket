import { Nav, PageFooter } from '@/components/nav'
import { DisputeForm } from '@/components/dispute/dispute-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit a Dispute',
  description: 'Report a Polymarket resolution you believe was inconsistent with the stated resolution criteria. Verdict documents cases for independent analysis.',
}

export default function SubmitDisputePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12 flex flex-col gap-0">

        <div className="border-b border-border pb-10 mb-10">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Community Review</p>
          <h1 className="font-heading text-5xl font-light tracking-tight text-foreground">
            Submit a Disputed Resolution
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xl">
            If you believe a market was resolved in a manner inconsistent with its stated
            resolution criteria, submit a case for independent documentation and analysis.
          </p>
          <div className="mt-6 border border-border px-5 py-4 max-w-xl">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This form collects information for documentation purposes only. Submission does not
              initiate any legal action or platform complaint. Anonymized cases may be published
              in the public interest.
            </p>
          </div>
        </div>

        <DisputeForm />

      </main>
      <PageFooter />
    </div>
  )
}
