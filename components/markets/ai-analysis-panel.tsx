'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, CheckCircle, MinusCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NormalizedMarket } from '@/lib/types'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

interface AiAnalysisPanelProps {
  market: NormalizedMarket
}

type Severity = 'critical' | 'high' | 'medium' | 'low'

interface AiResult {
  semanticScore: number
  agreement: 'agrees' | 'disagrees' | 'neutral'
  agreementNote: string
  findings: { severity: Severity; finding: string }[]
  verdict: string
  cached?: boolean
}

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> = {
  critical: { label: 'Critical',  className: 'bg-destructive/10 text-destructive border-destructive/20' },
  high:     { label: 'High',      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  medium:   { label: 'Medium',    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  low:      { label: 'Low',       className: 'bg-primary/10 text-primary border-primary/20' },
}

const AGREEMENT_CONFIG = {
  agrees:    { icon: CheckCircle,  label: 'Confirms rule-based score',  className: 'text-green-600' },
  disagrees: { icon: AlertTriangle, label: 'Diverges from rule-based score', className: 'text-orange-500' },
  neutral:   { icon: MinusCircle,  label: 'Neutral on rule-based score', className: 'text-muted-foreground' },
}

export function AiAnalysisPanel({ market }: AiAnalysisPanelProps) {
  const { data: session, isPending: sessionPending } = useSession()
  const [result, setResult]   = useState<AiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [ran, setRan] = useState(false)

  // On mount, silently check if a cached result already exists for this market.
  useEffect(() => {
    let cancelled = false
    async function checkCache() {
      try {
        const res = await fetch('/api/markets/ai-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId: market.marketId,
            question: market.question,
            description: market.description,
            resolutionSource: market.resolutionSource,
            outcomes: market.outcomes,
            deterministicScore: market.score.totalScore,
            riskLevel: market.score.riskLevel,
            scoreBreakdown: market.score.breakdown,
            scoreFlags: market.score.flags,
          }),
        })
        if (!res.ok) return
        const data = await res.json() as AiResult
        if (data.cached && !cancelled) {
          setResult(data)
          setRan(true)
        }
      } catch {
        // silently ignore — user can still trigger manually
      }
    }
    void checkCache()
    return () => { cancelled = true }
  }, [market.marketId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    setRan(true)
    try {
      const res = await fetch('/api/markets/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          marketId: market.marketId,
          question: market.question,
          description: market.description,
          resolutionSource: market.resolutionSource,
          outcomes: market.outcomes,
          deterministicScore: market.score.totalScore,
          riskLevel: market.score.riskLevel,
          scoreBreakdown: market.score.breakdown,
          scoreFlags: market.score.flags,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(j.error ?? `Error ${res.status}`)
      }
      const data = await res.json() as AiResult
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result
    ? result.semanticScore >= 75 ? 'text-green-600'
    : result.semanticScore >= 55 ? 'text-yellow-600'
    : result.semanticScore >= 38 ? 'text-orange-500'
    : 'text-destructive'
    : ''

  return (
    <section aria-labelledby="ai-analysis-heading" className="border border-border">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 id="ai-analysis-heading" className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground">
            AI Semantic Analysis
          </h2>
        </div>
        {result && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse AI analysis' : 'Expand AI analysis'}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Pre-run state */}
        {!ran && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Run a semantic analysis of this market&apos;s resolution criteria using an LLM.
              The AI identifies logical contradictions, ambiguous language, and missing definitions
              that rule-based scoring may miss.
            </p>
            <p className="text-xs text-muted-foreground">
              Deterministic score: <span className="font-medium text-foreground">{market.score.totalScore}/100</span> &middot; Risk level: <span className="font-medium text-foreground">{market.score.riskLevel}</span>
            </p>

            {/* Auth gate */}
            {sessionPending ? null : session ? (
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Run AI Analysis
              </button>
            ) : (
              <div className="flex items-center gap-3 border border-border px-4 py-3 bg-secondary/30">
                <Lock className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  <Link href="/sign-in" className="text-primary hover:underline font-medium">Sign in</Link>
                  {' '}to run AI analysis on this market.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
            <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
            Analysing resolution criteria...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={runAnalysis}
              className="text-xs text-primary hover:opacity-70 transition-opacity text-left"
            >
              Retry
            </button>
          </div>
        )}

        {/* Result */}
        {result && !loading && expanded && (
          <div className="flex flex-col gap-4">
            {/* Score row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Semantic Score</p>
                <p className={cn('text-2xl font-bold tabular-nums', scoreColor)}>
                  {result.semanticScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">vs Rule-based</p>
                {(() => {
                  const cfg = AGREEMENT_CONFIG[result.agreement]
                  const Icon = cfg.icon
                  return (
                    <div className={cn('flex items-center gap-1.5 text-sm', cfg.className)}>
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="font-medium">{cfg.label}</span>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Agreement note */}
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
              {result.agreementNote}
            </p>

            {/* Findings */}
            {result.findings.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground">Findings</p>
                <ul className="flex flex-col gap-1.5">
                  {result.findings.map((f, i) => {
                    const cfg = SEVERITY_CONFIG[f.severity] ?? SEVERITY_CONFIG.low
                    return (
                      <li key={i} className={cn('flex items-start gap-2 text-xs border px-3 py-2', cfg.className)}>
                        <span className="font-semibold shrink-0 uppercase">{cfg.label}</span>
                        <span>{f.finding}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Overall verdict */}
            <div className="bg-secondary/30 px-3 py-2.5 border border-border">
              <p className="text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1">AI Verdict</p>
              <p className="text-sm text-foreground leading-relaxed">{result.verdict}</p>
            </div>

            {/* Cached / re-run indicator */}
            {result.cached ? (
              <p className="text-xs text-muted-foreground">
                Cached result &mdash; this market has already been analysed.
              </p>
            ) : (
              <button
                onClick={runAnalysis}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Re-run analysis
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
