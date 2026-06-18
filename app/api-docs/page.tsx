import { Nav, PageFooter } from '@/components/nav'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'Public REST API for Verdict market clarity scores. Free, open, no auth required.',
}

const ENDPOINT = 'https://verdict.app/api/markets'

const PARAMS = [
  { name: 'risk',      type: 'string',  default: '—',    desc: 'Filter by risk level. One of: Critical, High, Medium, Low.' },
  { name: 'minScore',  type: 'number',  default: '0',    desc: 'Minimum clarity score (0–100).' },
  { name: 'limit',     type: 'number',  default: '100',  desc: 'Maximum results to return. Hard cap of 500.' },
  { name: 'offset',    type: 'number',  default: '0',    desc: 'Pagination offset.' },
]

const RESPONSE_EXAMPLE = `{
  "scannedAt": "2025-01-15T10:30:00.000Z",
  "eventCount": 42,
  "marketCount": 100,
  "markets": [
    {
      "marketId": "0x1a2b3c...",
      "question": "Will X happen by Y?",
      "eventCategory": "Politics",
      "volume": 1250000,
      "score": {
        "totalScore": 38,
        "riskLevel": "High",
        "breakdown": {
          "timeClarity": 12,
          "resolutionSource": 5,
          "outcomeDefinition": 7,
          "evidenceStandard": 5,
          "edgeCaseHandling": 4,
          "postHocRisk": 5
        },
        "flags": ["No resolution source specified"],
        "summary": "..."
      }
    }
  ]
}`

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 flex flex-col gap-0">

        {/* Header */}
        <div className="border-b border-border pb-10 mb-10">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Developer</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-foreground">
            API Reference
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xl">
            Verdict exposes a free, read-only REST API with no authentication required.
            All scores are recomputed from the Polymarket Gamma API and cached for 5 minutes.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="text-xs border border-border px-3 py-1 text-muted-foreground">No auth required</span>
            <span className="text-xs border border-border px-3 py-1 text-muted-foreground">CORS: *</span>
            <span className="text-xs border border-border px-3 py-1 text-muted-foreground">JSON only</span>
            <span className="text-xs border border-border px-3 py-1 text-muted-foreground">Cache: 5 min</span>
          </div>
        </div>

        {/* Endpoint */}
        <section className="border-b border-border pb-10 mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-6">GET /api/markets</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Returns all active Polymarket markets with their Verdict clarity scores, sorted by score ascending (lowest clarity first) by default.
          </p>

          {/* Base URL */}
          <div className="border border-border mb-8">
            <div className="px-4 py-2 border-b border-border bg-secondary/30">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Base URL</p>
            </div>
            <div className="px-4 py-3">
              <code className="font-mono text-sm text-foreground">{ENDPOINT}</code>
            </div>
          </div>

          {/* Query Parameters */}
          <h3 className="font-heading text-lg font-light text-foreground mb-4">Query Parameters</h3>
          <div className="border border-border mb-8">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[120px_80px_80px_1fr] px-4 py-2 border-b border-border bg-secondary/30">
              {['Parameter', 'Type', 'Default', 'Description'].map((h) => (
                <p key={h} className="text-xs tracking-[0.1em] uppercase text-muted-foreground">{h}</p>
              ))}
            </div>
            {PARAMS.map((p, i) => (
              <div
                key={p.name}
                className={`grid grid-cols-1 sm:grid-cols-[120px_80px_80px_1fr] px-4 py-3 gap-1 sm:gap-0 ${i < PARAMS.length - 1 ? 'border-b border-border' : ''}`}
              >
                <code className="font-mono text-sm text-foreground">{p.name}</code>
                <span className="text-xs text-muted-foreground sm:pt-0.5">{p.type}</span>
                <span className="text-xs text-muted-foreground sm:pt-0.5 font-mono">{p.default}</span>
                <span className="text-xs text-muted-foreground leading-relaxed">{p.desc}</span>
              </div>
            ))}
          </div>

          {/* Example Request */}
          <h3 className="font-heading text-lg font-light text-foreground mb-4">Example Request</h3>
          <div className="border border-border mb-8">
            <div className="px-4 py-2 border-b border-border bg-secondary/30">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">cURL</p>
            </div>
            <div className="px-4 py-4 overflow-x-auto">
              <pre className="font-mono text-sm text-foreground whitespace-pre">{`curl "${ENDPOINT}?risk=Critical&limit=10"`}</pre>
            </div>
          </div>

          {/* Example Response */}
          <h3 className="font-heading text-lg font-light text-foreground mb-4">Example Response</h3>
          <div className="border border-border">
            <div className="px-4 py-2 border-b border-border bg-secondary/30 flex items-center justify-between">
              <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground">JSON</p>
              <span className="text-xs text-muted-foreground">HTTP 200</span>
            </div>
            <div className="px-4 py-4 overflow-x-auto">
              <pre className="font-mono text-xs text-muted-foreground whitespace-pre leading-relaxed">{RESPONSE_EXAMPLE}</pre>
            </div>
          </div>
        </section>

        {/* Score fields */}
        <section className="border-b border-border pb-10 mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-6">Score Object</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Every market contains a <code className="font-mono text-xs border border-border px-1.5 py-0.5">score</code> object with these fields:
          </p>
          {[
            { field: 'totalScore',     type: 'number (0–100)',  desc: 'Aggregate Verdict clarity score.' },
            { field: 'riskLevel',      type: 'string',          desc: 'One of: Low (75+), Medium (55–74), High (38–54), Critical (<38).' },
            { field: 'breakdown',      type: 'object',          desc: 'Per-dimension scores: timeClarity, resolutionSource, outcomeDefinition, evidenceStandard, edgeCaseHandling, postHocRisk.' },
            { field: 'flags',          type: 'string[]',        desc: 'Human-readable list of identified clarity issues.' },
            { field: 'summary',        type: 'string',          desc: 'One-paragraph narrative explanation of the score.' },
            { field: 'dimensionDetails', type: 'object',        desc: 'Per-dimension explanation strings (same keys as breakdown).' },
          ].map((row, i, arr) => (
            <div key={row.field} className={`grid grid-cols-1 sm:grid-cols-[160px_160px_1fr] px-4 py-3 border border-b-0 border-border gap-1 sm:gap-0 ${i === arr.length - 1 ? 'border-b' : ''}`}>
              <code className="font-mono text-sm text-foreground">{row.field}</code>
              <span className="text-xs text-muted-foreground sm:pt-0.5">{row.type}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{row.desc}</span>
            </div>
          ))}
        </section>

        {/* Rate limits */}
        <section className="border-b border-border pb-10 mb-10">
          <h2 className="font-heading text-2xl font-light text-foreground mb-4">Rate Limits &amp; Caching</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            There is no rate limiting at this time. Responses are cached at the edge for 5 minutes
            (<code className="font-mono text-xs border border-border px-1.5 py-0.5">s-maxage=300</code>), so consecutive requests within that window return instantly.
            Please do not poll more than once per minute.
          </p>
        </section>

        {/* Links */}
        <section>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/methodology"
              className="text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors border-b border-border pb-0.5"
            >
              Scoring Methodology
            </Link>
            <Link
              href="/dashboard"
              className="text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors border-b border-border pb-0.5"
            >
              Open Dashboard
            </Link>
            <a
              href={ENDPOINT}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-[0.08em] uppercase text-primary hover:underline underline-offset-4"
            >
              Live API endpoint ↗
            </a>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
