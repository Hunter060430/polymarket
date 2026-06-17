import { Nav, PageFooter } from '@/components/nav'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const CRITERIA = [
  {
    name: 'Time Clarity',
    max: 20,
    description:
      'Evaluates whether the market specifies when resolution occurs and in which timezone. Markets that use time-sensitive language without timezone references are penalized.',
    rules: [
      { text: '+6 — End date is specified', type: 'positive' },
      { text: '+5 — Question or description references temporal terms (before, by, after, between, until, or an explicit date)', type: 'positive' },
      { text: '+5 — Description includes a timezone (ET, UTC, GMT, EST, EDT)', type: 'positive' },
      { text: '+4 — Description distinguishes between event time and announcement/report/disclosure time', type: 'positive' },
      { text: '−5 — Time-sensitive language is present but no timezone is mentioned', type: 'negative' },
    ],
  },
  {
    name: 'Resolution Source',
    max: 20,
    description:
      'Evaluates whether the resolution source is named, authoritative, and hierarchically structured. Vague sourcing language ("credible reporting", "consensus") is penalized.',
    rules: [
      { text: '+10 — A resolution source URL or named authority is provided', type: 'positive' },
      { text: '+5 — Description references official or institutional sources (government, SEC, FIFA, Federal Reserve, on-chain, etc.)', type: 'positive' },
      { text: '+5 — Description defines a source hierarchy for conflict resolution', type: 'positive' },
      { text: '−5 — Resolution relies on undefined "credible reporting", "reliable sources", or "substantial evidence"', type: 'negative' },
    ],
  },
  {
    name: 'Outcome Definition',
    max: 20,
    description:
      'Evaluates whether the question is concise and unambiguous, whether outcomes are binary YES/NO, and whether the description defines what constitutes a YES resolution.',
    rules: [
      { text: '+8 — Question is under 180 characters', type: 'positive' },
      { text: '+6 — Outcomes are binary YES/NO', type: 'positive' },
      { text: '+6 — Description explicitly defines what must happen for YES resolution', type: 'positive' },
      { text: '−5 — Question or description uses ambiguous qualifiers (significant, major, reportedly, effectively, confirmed)', type: 'negative' },
    ],
  },
  {
    name: 'Evidence Standard',
    max: 15,
    description:
      'Evaluates whether the market defines what types of evidence are acceptable, what is excluded, and whether specific evidence formats are named.',
    rules: [
      { text: '+5 — Description specifies what evidence counts toward resolution', type: 'positive' },
      { text: '+5 — Description specifies what evidence does not count', type: 'positive' },
      { text: '+5 — Named evidence types are referenced (filings, on-chain data, official statements, published reports)', type: 'positive' },
      { text: '−5 — Resolution depends on undefined "confirmation" or "credible sources"', type: 'negative' },
    ],
  },
  {
    name: 'Edge Case Handling',
    max: 15,
    description:
      'Evaluates whether the market addresses common resolution edge cases: delays, revisions, cancellations, postponements, and events reported after the deadline.',
    rules: [
      { text: '+5 — Description addresses delays', type: 'positive' },
      { text: '+5 — Description addresses revisions, corrections, cancellations, postponements, or disputes', type: 'positive' },
      { text: '+5 — Description explains what happens if events are reported after the deadline', type: 'positive' },
      { text: '−5 — Market is time-sensitive but does not address late reporting or delayed disclosure', type: 'negative' },
    ],
  },
  {
    name: 'Post-Trade Risk',
    max: 10,
    description:
      'Starts at full score and is reduced based on structural weaknesses: short descriptions, missing resolution sources, and timing-ambiguous confirmation language.',
    rules: [
      { text: 'Starts at 10', type: 'neutral' },
      { text: '−4 — Description is under 250 characters', type: 'negative' },
      { text: '−3 — No resolution source is specified', type: 'negative' },
      { text: '−3 — Resolution relies on confirmed/announced/reported without a defined timing constraint', type: 'negative' },
      { text: 'Minimum: 0', type: 'neutral' },
    ],
  },
]

const RISK_LEVELS = [
  {
    label: 'Low',
    range: '80–100',
    description: 'Well-specified resolution criteria with low post-trade dispute risk.',
    style: 'border-l-2 border-l-[var(--risk-low)]',
    textStyle: 'text-[var(--risk-low)]',
  },
  {
    label: 'Medium',
    range: '60–79',
    description: 'Some ambiguity present. Human review recommended before large positions.',
    style: 'border-l-2 border-l-[var(--risk-medium)]',
    textStyle: 'text-[var(--risk-medium)]',
  },
  {
    label: 'High',
    range: '40–59',
    description: 'Significant rule clarity concerns. Material dispute potential exists.',
    style: 'border-l-2 border-l-[var(--risk-high)]',
    textStyle: 'text-[var(--risk-high)]',
  },
  {
    label: 'Critical',
    range: '0–39',
    description: 'Substantially underspecified. High dispute risk for all participants.',
    style: 'border-l-2 border-l-[var(--risk-critical)]',
    textStyle: 'text-[var(--risk-critical)]',
  },
]

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8 flex flex-col gap-10">

        {/* Page header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-2">
            How It Works
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground">
            Scoring Methodology
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            How the Rule Clarity Index evaluates prediction market resolution quality.
          </p>
        </div>

        {/* Overview */}
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-light text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The score is built from six weighted criteria. Each criterion captures a distinct dimension
            of resolution quality that affects a participant&apos;s ability to predict how a dispute
            would be resolved.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The model is deterministic: it applies the same rules to every market without external
            data lookup. It operates on the question text, description, resolution source field,
            outcomes list, and end date.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Markets with low scores are not necessarily fraudulent. A low score indicates that the
            written resolution criteria are underspecified relative to the complexity of the event
            being measured.
          </p>
          <p className="text-xs text-muted-foreground border border-border px-4 py-3 leading-relaxed">
            This is a heuristic v1 model intended to be improved over time with human review,
            community feedback, and AI-assisted analysis. Scores are not legal or financial advice.
          </p>
        </div>

        <Separator />

        {/* Scoring Criteria */}
        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-xl font-light text-foreground">Scoring Criteria</h2>
          {CRITERIA.map((c, i) => (
            <div key={c.name} className="flex flex-col gap-2 border-l-2 border-l-border pl-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-base font-medium text-foreground">
                  {i + 1}. {c.name}
                </h3>
                <Badge variant="secondary" className="text-xs shrink-0">
                  Max {c.max} pts
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
              <ul className="flex flex-col gap-1 mt-1">
                {c.rules.map((rule, j) => (
                  <li
                    key={j}
                    className={`text-xs leading-relaxed flex items-start gap-2 ${
                      rule.type === 'negative'
                        ? 'text-destructive'
                        : rule.type === 'neutral'
                        ? 'text-muted-foreground italic'
                        : 'text-foreground'
                    }`}
                  >
                    <span
                      className="shrink-0 mt-1 size-1 rounded-full bg-current opacity-40"
                      aria-hidden="true"
                    />
                    {rule.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        {/* Risk Levels */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-light text-foreground">Risk Levels</h2>
          {RISK_LEVELS.map((r) => (
            <div key={r.label} className={`flex items-start gap-5 pl-4 py-1 ${r.style}`}>
              <div className="shrink-0 w-20">
                <p className={`font-heading text-lg font-light ${r.textStyle}`}>{r.label}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{r.range} pts</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Limitations */}
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-light text-foreground">Limitations</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The v1 model does not evaluate the quality of the underlying event being measured, the
            financial integrity of the platform, or the historical resolution record of similar
            markets. It evaluates only the written clarity of the resolution criteria.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Text heuristics can be gamed by adding verbose but meaningless language to a description.
            Future versions will incorporate resolution history, community-flagged disputes, and
            AI-assisted semantic analysis to reduce this risk.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This index is operated independently and has no affiliation with Polymarket or any other
            prediction market platform.
          </p>
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
