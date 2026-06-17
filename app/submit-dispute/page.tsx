import { Nav, PageFooter } from '@/components/nav'
import { DisputeForm } from '@/components/dispute/dispute-form'

export default function SubmitDisputePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-8 flex flex-col gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-2">
            Community Review
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground">
            Submit a Disputed Resolution
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            If you believe a market was resolved in a manner inconsistent with its stated resolution criteria, submit a case for independent documentation and analysis. This does not initiate any legal action or platform complaint.
          </p>
        </div>
        <DisputeForm />
      </main>
      <PageFooter />
    </div>
  )
}
