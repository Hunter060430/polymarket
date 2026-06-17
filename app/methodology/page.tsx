import { Nav } from '@/components/nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

const CRITERIA = [
  {
    name: 'Time Clarity',
    max: 20,
    description:
      'Evaluates whether the market specifies when resolution occurs and in which timezone. Markets that use time-sensitive language without timezone references are penalized.',
    rules: [
      '+6 — End date is specified',
      '+5 — Question or description references temporal terms (before, by, after, between, until, or an explicit date)',
      '+5 — Description includes a timezone (ET, UTC, GMT, EST, EDT)',
      '+4 — Description distinguishes between event time and announcement/report/disclosure time',
      '−5 — Time-sensitive language is present but no timezone is mentioned',
    ],
  },
  {
    name: 'Resolution Source',
    max: 20,
    description:
      'Evaluates whether the resolution source is named, authoritative, and hierarchically structured. Vague sourcing language ("credible reporting", "consensus") is penalized.',
    rules: [
      '+10 — A resolution source URL or named authority is provided',
      '+5 — Description references official or institutional sources (government, SEC, FIFA, Federal Reserve, on-chain, etc.)',
      '+5 — Description defines a source hierarchy for conflict resolution',
      '−5 — Resolution relies on undefined "credible reporting", "reliable sources", or "substantial evidence"',
    ],
  },
  {
    name: 'Outcome Definition',
    max: 20,
    description:
      'Evaluates whether the question is concise and unambiguous, whether outcomes are binary YES/NO, and whether the description defines what constitutes a YES resolution.',
    rules: [
      '+8 — Question is under 180 characters',
      '+6 — Outcomes are binary YES/NO',
      '+6 — Description explicitly defines what must happen for YES resolution',
      '−5 — Question or description uses ambiguous qualifiers (significant, major, reportedly, effectively, confirmed)',
    ],
  },
  {
    name: 'Evidence Standard',
    max: 15,
    description:
      'Evaluates whether the market defines what types of evidence are acceptable, what is excluded, and whether specific evidence formats are named.',
    rules: [
      '+5 — Description specifies what evidence counts toward resolution',
      '+5 — Description specifies what evidence does not count',
      '+5 — Named evidence types are referenced (filings, on-chain data, official statements, published reports)',
      '−5 — Resolution depends on undefined "confirmation" or "credible sources"',
    ],
  },
  {
    name: 'Edge Case Handling',
    max: 15,
    description:
      'Evaluates whether the market addresses common resolution edge cases: delays, revisions, cancellations, postponements, and events reported after the deadline.',
    rules: [
      '+5 — Description addresses delays',
      '+5 — Description addresses revisions, corrections, cancellations, postponements, or disputes',
      '+5 — Description explains what happens if events are reported after the deadline',
      '−5 — Market is time-sensitive but does not address late reporting or delayed disclosure',
    ],
  },
  {
    name: 'Post-Trade Risk',
    max: 10,
    description:
      'Starts at full score and is reduced based on structural weaknesses: short descriptions, missing resolution sources, and timing-ambiguous confirmation language.',
    rules: [
      'Starts at 10',
      '−4 — Description is under 250 characters',
      '−3 — No resolution source is specified',
      '−3 — Resolution relies on confirmed/announced/reported without a defined timing constraint',
      'Minimum: 0',
    ],
  },
]

const RISK_LEVELS = [
  { label: 'Low', range: '80–100', description: 'Well-specified resolution criteria with low post-trade dispute risk.' },
  { label: 'Medium', range: '60–79', description: 'Some ambiguity present. Human review recommended before large positions.' },
  { label: 'High', range: '40–59', description: 'Significant rule clarity concerns. Material dispute potential exists.' },
  { label: 'Critical', range: '0–39', description: 'Substantially underspecified. High dispute risk for all participants.' },
]

const RISK_STYLES: Record<string, string> = {
  Low: 'bg-[oklch(0.90_0.08_145)] text-[oklch(0.28_0.1_145)] border-[oklch(0.75_0.12_145)]',
  Medium: 'bg-[oklch(0.96_0.08_75)] text-[oklch(0.40_0.14_60)] border-[oklch(0.82_0.14_75)]',
  High: 'bg-[oklch(0.96_0.09_45)] text-[oklch(0.36_0.16_40)] border-[oklch(0.78_0.16_45)]',
  Critical: 'bg-[oklch(0.95_0.10_27)] text-[oklch(0.35_0.18_27)] border-[oklch(0.72_0.18_27)]',
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Scoring Methodology
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            How the Rule Clarity Index evaluates prediction market resolution quality.
          </p>
        </div>

        <Alert className="border-border bg-muted/40">
          <Info className="size-4 text-muted-foreground" aria-hidden="true" />
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
            This is a heuristic v1 model. It applies deterministic text-analysis rules to market data. It is intended to be improved over time with human review, community feedback, and AI-assisted analysis. Scores are not legal or financial advice.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Overview</CardTitle>
            <CardDescription className="text-xs">
              Each market is assigned a Rule Clarity Score from 0 to 100.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed flex flex-col gap-3">
            <p>
              The score is built from six weighted criteria. Each criterion captures a distinct dimension of resolution quality that affects a market participant&apos;s ability to predict how a dispute would be resolved.
            </p>
            <p>
              The model is deterministic: it applies the same rules to every market without external data lookup. It operates on the question text, description, resolution source field, outcomes list, and end date.
            </p>
            <p>
              Markets with low scores are not necessarily fraudulent. A low score indicates that the written resolution criteria are underspecified relative to the complexity of the event being measured. Low-clarity markets carry elevated post-trade risk because participants may interpret resolution criteria differently, increasing the probability of a disputed resolution.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Scoring Criteria</h2>
          <div className="flex flex-col gap-4">
            {CRITERIA.map((c, i) => (
              <Card key={c.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {i + 1}. {c.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Max {c.max} pts
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed">
                    {c.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1.5">
                    {c.rules.map((rule, j) => {
                      const isDeduct = rule.startsWith('−')
                      const isStart = rule.startsWith('Starts') || rule.startsWith('Minimum')
                      return (
                        <li
                          key={j}
                          className={`text-xs leading-relaxed flex items-start gap-2 ${
                            isDeduct
                              ? 'text-destructive'
                              : isStart
                              ? 'text-muted-foreground italic'
                              : 'text-foreground'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5 size-1.5 rounded-full bg-current opacity-50" aria-hidden="true" />
                          {rule}
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Risk Levels</h2>
          <div className="flex flex-col gap-3">
            {RISK_LEVELS.map((r) => (
              <div key={r.label} className="flex items-start gap-4">
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs font-semibold border ${RISK_STYLES[r.label]}`}
                >
                  {r.label}
                </Badge>
                <div>
                  <p className="text-xs font-medium text-foreground">{r.range} points</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Limitations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed flex flex-col gap-3">
            <p>
              The v1 model does not evaluate the quality of the underlying event being measured, the financial integrity of the platform, or the historical resolution record of similar markets. It evaluates only the written clarity of the resolution criteria.
            </p>
            <p>
              Text heuristics can be gamed by adding verbose but meaningless language to a description. Future versions will incorporate resolution history, community-flagged disputes, and AI-assisted semantic analysis to reduce this risk.
            </p>
            <p>
              This index is operated independently and has no affiliation with Polymarket or any other prediction market platform.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
