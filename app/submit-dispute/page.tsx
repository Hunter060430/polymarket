import { Nav } from '@/components/nav'
import { DisputeForm } from '@/components/dispute/dispute-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function SubmitDisputePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Submit a Disputed Resolution</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            If you believe a market was resolved in a manner inconsistent with its stated resolution criteria, you can submit a case for independent review and documentation.
          </p>
        </div>

        <Alert className="border-border bg-muted/40">
          <Info className="size-4 text-muted-foreground" aria-hidden="true" />
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
            This form collects information for documentation and analysis purposes only. Submission does not initiate any legal action or platform complaint on your behalf. Anonymized cases may be published in the public interest.
          </AlertDescription>
        </Alert>

        <DisputeForm />
      </main>
    </div>
  )
}
