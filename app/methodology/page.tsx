import { Nav, PageFooter } from '@/components/nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Verdict scores prediction market resolution quality across six weighted dimensions. Fully documented, deterministic, and open.',
}

const CRITERIA = [
  {
    num: '01',
    name: 'Time Clarity',
    max: 20,
    description:
      'Evaluates whether the market specifies when resolution occurs and in which timezone. Markets that use time-sensitive language without timezone references are penalized.',
    rules: [
      { text: '+6 — End date is specified', positive: true },
      { text: '+5 — Question or description references temporal terms (before, by, after, between, until, or an explicit date)', positive: true },
      { text: '+5 — Description includes a timezone (ET, UTC, GMT, EST, EDT)', positive: true },
      { text: '+4 — Description distinguishes between event time and announcement / report / disclosure time', positive: true },
      { text: '−5 — Time-sensitive language is present but no timezone is mentioned', positive: false },
    ],
  },
  {
    num: '02',
    name: 'Resolution Source',
    max: 20,
    description:
      'Evaluates whether the resolution source is named, authoritative, and hierarchically structured. Vague sourcing language ("credible reporting", "consensus") is penalized.',
    rules: [
      { text: '+10 — A resolution source URL or named authority is provided', positive: true },
      { text: '+5 — Description references official or institutional sources (government, SEC, FIFA, Federal Reserve, on-chain, etc.)', positive: true },
      { text: '+5 — Description defines a source hierarchy for conflict resolution', positive: true },
      { text: '−5 — Resolution relies on undefined "credible reporting", "reliable sources", or "substantial evidence"', positive: false },
    ],
  },
  {
    num: '03',
    name: 'Outcome Definition',
    max: 20,
    description:
      'Evaluates whether the question is concise and unambiguous, whether outcomes are binary YES/NO, and whether the description defines what constitutes a YES resolution.',
    rules: [
      { text: '+8 — Question is under 180 characters', positive: true },
      { text: '+6 — Outcomes are binary YES/NO', positive: true },
      { text: '+6 — Description explicitly defines what must happen for YES resolution', positive: true },
      { text: '−5 — Question or description uses ambiguous qualifiers (significant, major, reportedly, effectively, confirmed)', positive: false },
    ],
  },
  {
    num: '04',
    name: 'Evidence Standard',
    max: 15,
    description:
      'Evaluates whether the market defines what types of evidence are acceptable, what is excluded, and whether specific evidence formats are named.',
    rules: [
      { text: '+5 — Description specifies what evidence counts toward resolution', positive: true },
      { text: '+5 — Description specifies what evidence does not count', positive: true },
      { text: '+5 — Named evidence types are referenced (filings, on-chain data, official statements, published reports)', positive: true },
      { text: '−5 — Resolution depends on undefined "confirmation" or "credible sources"', positive: false },
    ],
  },
  {
    num: '05',
    name: 'Edge Case Handling',
    max: 15,
    description:
      'Evaluates whether the market addresses common resolution edge cases: delays, revisions, cancellations, postponements, and events reported after the deadline.',
    rules: [
      { text: '+5 — Description addresses delays', positive: true },
      { text: '+5 — Description addresses revisions, corrections, cancellations, postponements, or disputes', positive: true },
      { text: '+5 — Description explains what happens if events are reported after the deadline', positive: true },
      { text: '−5 — Market is time-sensitive but does not address late reporting or delayed disclosure', positive: false },
    ],
  },
  {
    num: '06',
    name: 'Post-Trade Risk',
    max: 10,
    description:
      'Starts at full score and is reduced based on structural weaknesses: short descriptions, missing resolution sources, and timing-ambiguous confirmation language.',
    rules: [
      { text: 'Starts at 10', positive: true },
      { text: '−4 — Description is under 250 characters', positive: false },
      { text: '−3 — No resolution source is specified', positive: false },
      { text: '−3 — Resolution relies on confirmed/announced/reported without a defined timing constraint', positive: false },
      { text: 'Minimum: 0', positive: true },
    ],
  },
]

const RISK_LEVELS = [
  { label: 'Low',      range: '80–100', color: 'var(--risk-low)',      note: 'Well-specified resolution criteria with low post-trade dispute risk.' },
  { label: 'Medium',   range: '60–79',  color: 'var(--risk-medium)',   note: 'Some ambiguity present. Human review recommended before large positions.' },
  { label: 'High',     range: '40–59',  color: 'var(--risk-high)',     note: 'Significant rule clarity concerns. Material dispute potential exists.' },
  { label: 'Critical', range: '0–39',   color: 'var(--risk-critical)', note: 'Substantially underspecified. High dispute risk for all participants.' },
]

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12 flex flex-col gap-0">

        {/* ── Page header ───────────────────────────────── */}
        <div className="border-b border-border pb-10 mb-12">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">How It Works</p>
          <h1 className="font-heading text-5xl font-light tracking-tight text-foreground">
            Scoring Methodology
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xl">
            How Verdict evaluates prediction market resolution quality across six weighted dimensions. Deterministic, documented, and applied equally to every market.
          </p>
        </div>

        {/* ── Overview ──────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-6">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
            <p>
              The score is built from six weighted criteria. Each criterion captures a distinct dimension
              of resolution quality that affects a participant&apos;s ability to predict how a dispute
              would be resolved.
            </p>
            <p>
              The model is deterministic: it applies the same rules to every market without external
              data lookup. It operates on the question text, description, resolution source field,
              outcomes list, and end date.
            </p>
            <p>
              Markets with low scores are not necessarily fraudulent. A low score indicates that the
              written resolution criteria are underspecified relative to the complexity of the event
              being measured.
            </p>
            <div className="border border-border px-5 py-4 text-xs leading-relaxed">
              <p className="text-xs tracking-[0.1em] uppercase text-foreground mb-2">Note</p>
              This is a heuristic v1 model intended to be improved over time with human review,
              community feedback, and AI-assisted analysis. Scores are not legal or financial advice.
            </div>
          </div>
        </section>

        {/* ── Criteria ──────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-8">Scoring Criteria</h2>
          <div className="flex flex-col gap-0 divide-y divide-border border-t border-border">
            {CRITERIA.map((c) => (
              <div key={c.num} className="py-8 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 lg:gap-12">
                {/* Left label */}
                <div>
                  <p className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-1">{c.num}</p>
                  <p className="font-heading text-xl font-light text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">Max {c.max} pts</p>
                </div>
                {/* Right content */}
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.description}</p>
                  <ul className="flex flex-col gap-2">
                    {c.rules.map((rule, j) => (
                      <li key={j} className="flex items-start gap-3 text-xs leading-relaxed">
                        <span
                          className="mt-1 size-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: rule.positive ? 'var(--risk-low)' : 'var(--risk-critical)' }}
                          aria-hidden="true"
                        />
                        <span className={rule.positive ? 'text-foreground' : 'text-[var(--risk-critical)]'}>
                          {rule.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Risk Levels ───────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-8">Risk Levels</h2>
          <div className="flex flex-col gap-0 divide-y divide-border border-t border-border">
            {RISK_LEVELS.map((r) => (
              <div key={r.label} className="py-6 flex items-start gap-6">
                <div
                  className="w-1 self-stretch shrink-0"
                  style={{ backgroundColor: r.color }}
                  aria-hidden="true"
                />
                <div className="w-28 shrink-0">
                  <p className="font-heading text-2xl font-light" style={{ color: r.color }}>{r.label}</p>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{r.range} pts</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{r.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Changelog ─────────────────────────────────── */}
        <section className="border-b border-border pb-12 mb-12">
          <h2 className="font-heading text-3xl font-light text-foreground mb-6">Version History</h2>
          <div className="flex flex-col">
            {[
              {
                version: 'v1.2',
                date: 'Jun 2025',
                changes: [
                  'Raised all baseline scores — most markets now receive 40–70 (previously 20–50).',
                  'Decoupled timezone bonus from time-anchor requirement in scoreTimeClarity.',
                  'Fixed operator-precedence bug in scoreEvidenceStandard that caused near-universal penalty.',
                  'scoreEdgeCaseHandling no longer penalises markets simply for containing deadline language.',
                ],
              },
              {
                version: 'v1.1',
                date: 'May 2025',
                changes: [
                  'Added dimensionDetails field: per-dimension explanation strings exposed in UI and API.',
                  'MAX_EVENTS increased from 200 to 500 for broader market coverage.',
                  'Resolved markets separated into dedicated /markets/resolved endpoint.',
                ],
              },
              {
                version: 'v1.0',
                date: 'Apr 2025',
                changes: [
                  'Initial public release of the Verdict scoring model.',
                  'Six-dimension heuristic framework: timeClarity, resolutionSource, outcomeDefinition, evidenceStandard, edgeCaseHandling, postHocRisk.',
                  'Risk thresholds: Low (75+), Medium (55–74), High (38–54), Critical (<38).',
                ],
              },
            ].map((entry, i, arr) => (
              <div key={entry.version} className={`grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 sm:gap-8 py-6 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="shrink-0">
                  <p className="font-heading text-xl font-light text-foreground">{entry.version}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.date}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {entry.changes.map((change, j) => (
                    <li key={j} className="text-sm text-muted-foreground leading-relaxed flex gap-3">
                      <span className="text-border mt-1.5 shrink-0" aria-hidden="true">—</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Confidence & Limitations ──────────────────── */}
        <section>
          <h2 className="font-heading text-3xl font-light text-foreground mb-3">
            Known Limitations &amp; Confidence
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Verdict is a transparent heuristic, not a precise science. We believe stating its limits
            openly makes the score more useful, not less. Here is exactly where the model can be wrong.
          </p>

          {/* Confidence banner */}
          <div className="border-l-2 border-primary pl-5 py-1 mb-10">
            <p className="text-sm text-foreground leading-relaxed">
              Treat each score as accurate to roughly <span className="font-medium">±8 points</span>.
              A market scoring 62 and one scoring 68 are effectively equivalent. The risk
              <span className="italic"> bands</span> (Low / Medium / High / Critical) are more
              meaningful than the exact number.
            </p>
          </div>

          {/* Known failure modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border mb-10">
            {[
              {
                title: 'False positives (scores too high)',
                items: [
                  'Verbose padding: a description stuffed with boilerplate legal language scores well on length-based signals without actually being clearer.',
                  'Keyword gaming: naming an "official source" earns points even if that source does not actually adjudicate the specific question.',
                  'Template reuse: well-structured templates inherit a high baseline even when the specific event is genuinely ambiguous.',
                ],
              },
              {
                title: 'False negatives (scores too low)',
                items: [
                  'Self-evident questions: "Will BTC be above $100k on Jan 1?" needs little prose, yet is penalised for a short description.',
                  'External rulebooks: markets that link to a comprehensive off-site rulebook are under-credited because the text itself looks thin.',
                  'Non-English or symbol-heavy phrasing can suppress keyword matches that would otherwise add points.',
                ],
              },
            ].map((col) => (
              <div key={col.title} className="bg-background px-5 py-5">
                <p className="text-xs tracking-[0.1em] uppercase text-foreground mb-4">{col.title}</p>
                <ul className="flex flex-col gap-3">
                  {col.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2.5">
                      <span className="text-border mt-0.5 shrink-0" aria-hidden="true">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Scope statements */}
          <div className="flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              The model does <span className="text-foreground">not</span> evaluate the quality of the
              underlying event, the financial integrity of the platform, the on-chain dispute history,
              or the track record of similar markets. It evaluates only the written clarity of the
              resolution criteria as published by the market creator.
            </p>
            <p>
              Because the engine is rule-based, every score is fully reproducible and auditable — the
              per-market <span className="text-foreground">scoring trace</span> on each market page
              shows exactly which terms triggered each adjustment. There is no black box.
            </p>
            <p>
              Verdict is operated independently and has no affiliation with Polymarket or any other
              prediction market platform. Scores are not legal or financial advice.
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
