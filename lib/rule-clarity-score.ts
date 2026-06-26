import type { RuleClarityScore, RuleClarityBreakdown, RiskLevel, ScoreTraceEntry } from './types'

// ─── Vocabulary lists ────────────────────────────────────────────────────────

const TIMEZONE_WORDS   = ['ET', 'UTC', 'Eastern Time', 'GMT', 'EST', 'EDT', 'PT', 'CT', 'MT']
const TIME_ANCHOR_WORDS = ['by', 'before', 'after', 'between', 'until', 'no later than', 'at least']
const OFFICIAL_SOURCE_WORDS = [
  'official', 'government', 'SEC', 'company announcement', 'filing', 'court',
  'FIFA', 'Federal Reserve', 'BLS', 'CPI', 'on-chain', 'USDA', 'WHO', 'FDA',
  'CME', 'CFTC', 'Treasury', 'census', 'congressional',
  // Price / market data sources — objective, machine-readable, low dispute risk
  'coinbase', 'binance', 'coingecko', 'coinmarketcap', 'kraken', 'bybit', 'okx',
  'tradingview', 'chainlink', 'pyth', 'band protocol', 'nasdaq', 'bloomberg',
  'closing price', 'spot price', 'last traded price', 'price feed',
]

// Regex to detect price-prediction markets (e.g. "Will BTC reach $100k by Dec 2025?")
const PRICE_MARKET_RE = /\b(reach|exceed|above|below|hit|close above|close below|trade above|trade at|over|under)\b.*\$[\d,]+|\$[\d,]+.*(reach|exceed|above|below)/i
const VAGUE_SOURCE_WORDS   = ['credible reporting', 'reliable sources', 'consensus', 'substantial evidence']
const EVIDENCE_TYPES       = ['screenshots', 'official statements', 'filings', 'data providers', 'on-chain transactions', 'published reports', 'press release', 'verified']
const AMBIGUOUS_WORDS      = ['significant', 'major', 'substantial', 'likely', 'reportedly', 'effectively']
const LATE_REPORTING_PHRASES = ['after the deadline', 'late reporting', 'reported after', 'disclosed after', 'retroactive']
const EDGE_CASE_WORDS      = ['revision', 'correction', 'cancellation', 'postponement', 'dispute', 'walkover', 'forfeit', 'appeal', 'rescind']
const POST_HOC_TRIGGER_WORDS = ['confirmed', 'announced', 'reported', 'official']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function includes(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase()
  return terms.some((t) => lower.includes(t.toLowerCase()))
}

// Returns the first matching term (for trace display), or '' if none match.
function firstMatch(text: string, terms: string[]): string {
  const lower = text.toLowerCase()
  return terms.find((t) => lower.includes(t.toLowerCase())) ?? ''
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ─── 1. Time Clarity (max 20) ────────────────────────────────────────────────

function scoreTimeClarity(question: string, description: string) {
  const flags: string[] = []
  const trace: ScoreTraceEntry[] = []
  const combined = `${question} ${description}`

  let score = 10
  trace.push({ rule: 'Baseline (has a question)', delta: 10 })

  const hasSpecificDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b20\d{2}\b/i.test(combined)
  if (hasSpecificDate) {
    score += 4
    const m = combined.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b20\d{2}\b/i)
    trace.push({ rule: 'Specific month or year named', delta: 4, matched: m?.[0] })
  }

  const anchor = firstMatch(combined, TIME_ANCHOR_WORDS)
  if (anchor) {
    score += 3
    trace.push({ rule: 'Explicit time anchor used', delta: 3, matched: anchor })
  }

  const tz = firstMatch(combined, TIMEZONE_WORDS)
  if (tz) {
    score += 3
    trace.push({ rule: 'Timezone specified', delta: 3, matched: tz })
  } else if (anchor) {
    score -= 1
    trace.push({ rule: 'Time anchor without timezone', delta: -1, matched: anchor })
    flags.push('Time-sensitive language used without explicit timezone.')
  }

  if (!description || description.trim().length < 10) {
    score -= 5
    trace.push({ rule: 'No / empty description', delta: -5 })
    flags.push('No description — time parameters cannot be fully evaluated.')
  }

  const capped = Math.max(0, Math.min(20, score))
  const details = capped >= 16
    ? 'Resolution timeline is explicitly defined with a specific date and time reference.'
    : capped >= 12
    ? 'Resolution timeline is reasonably clear from the question and description.'
    : capped >= 8
    ? 'Resolution timeline is present but could be more precisely specified.'
    : 'Resolution timeline is vague or missing from the description.'
  return { score: capped, details, flags, trace }
}

// ─── 2. Resolution Source (max 20) ───────────────────────────────────────────

function scoreResolutionSource(description: string, resolutionSource: string, question: string) {
  const flags: string[] = []
  const trace: ScoreTraceEntry[] = []

  // Price-prediction markets resolve against an objective price feed — inherently
  // verifiable and machine-readable, so treat them as having a strong source baseline.
  const isPriceMarket = PRICE_MARKET_RE.test(question) || PRICE_MARKET_RE.test(description)

  const hasSource = resolutionSource && resolutionSource.trim().length > 0
  let score = hasSource ? 8 : (isPriceMarket ? 7 : 4)
  trace.push({ rule: hasSource ? 'Resolution source present' : isPriceMarket ? 'Price market — objective price feed implied' : 'No resolution source field', delta: score })

  if (!hasSource) {
    flags.push('No explicit resolution source URL or reference provided.')
  } else if (/https?:\/\//.test(resolutionSource)) {
    score += 4
    trace.push({ rule: 'Named source URL provided', delta: 4 })
  }

  const official = firstMatch(description, OFFICIAL_SOURCE_WORDS)
  if (official) {
    score += 5
    trace.push({ rule: 'Authoritative source named', delta: 5, matched: official })
  }

  const lower = description.toLowerCase()
  if (lower.includes('primary') || lower.includes('secondary') || lower.includes('in the event')) {
    score += 3
    trace.push({ rule: 'Primary/secondary source fallback defined', delta: 3 })
  }

  const vague = firstMatch(description, VAGUE_SOURCE_WORDS)
  if (vague) {
    score -= 3
    trace.push({ rule: 'Vague source language', delta: -3, matched: vague })
    flags.push('Resolution source relies on vague terms such as "credible reporting" or "substantial evidence".')
  }

  const capped = Math.max(0, Math.min(20, score))
  const details = capped >= 16
    ? 'Resolution source is explicitly named and authoritative.'
    : capped >= 12
    ? 'Resolution source is referenced; an official body or named data provider is cited.'
    : capped >= 8
    ? 'A resolution source is indicated but lacks specificity or a verifiable URL.'
    : 'Resolution source is absent or relies on vague, unverifiable references.'
  return { score: capped, details, flags, trace }
}

// ─── 3. Outcome Definition (max 20) ──────────────────────────────────────────

function scoreOutcomeDefinition(question: string, description: string, outcomes: string[]) {
  const flags: string[] = []
  const trace: ScoreTraceEntry[] = []

  let score = question.length > 0 ? 8 : 2
  trace.push({ rule: question.length > 0 ? 'Baseline (valid question)' : 'Empty question', delta: question.length > 0 ? 8 : 2 })

  if (question.length > 200) {
    flags.push('Question is very long — may be difficult to parse at a glance.')
    score += 2
    trace.push({ rule: 'Long, detailed question', delta: 2 })
  }

  const isBinary =
    outcomes.length === 2 &&
    outcomes.some((o) => o.toLowerCase() === 'yes') &&
    outcomes.some((o) => o.toLowerCase() === 'no')
  if (isBinary) {
    score += 4
    trace.push({ rule: 'Clean binary YES/NO outcomes', delta: 4 })
  }

  const lower = description.toLowerCase()
  if (lower.includes('resolv') && (lower.includes('yes') || lower.includes('will resolve'))) {
    score += 6
    trace.push({ rule: 'Explicit resolution condition stated', delta: 6, matched: 'will resolve' })
  } else if (description.length > 80) {
    score += 3
    trace.push({ rule: 'Substantive description present', delta: 3 })
  }

  const ambiguous = firstMatch(question, AMBIGUOUS_WORDS) || firstMatch(description, AMBIGUOUS_WORDS)
  if (ambiguous) {
    score -= 3
    trace.push({ rule: 'Ambiguous qualifier used', delta: -3, matched: ambiguous })
    flags.push('Question or description contains ambiguous language (e.g. "significant", "major", "reportedly").')
  }

  const capped = Math.max(0, Math.min(20, score))
  const details = capped >= 16
    ? 'Outcome conditions are precisely defined with explicit YES/NO resolution criteria.'
    : capped >= 12
    ? 'Outcome is clear and binary; resolution conditions are described in the text.'
    : capped >= 8
    ? 'Outcome is broadly understandable but resolution criteria could be more explicit.'
    : 'Outcome definition is ambiguous or the resolution condition is not stated.'
  return { score: capped, details, flags, trace }
}

// ─── 4. Evidence Standard (max 15) ───────────────────────────────────────────

function scoreEvidenceStandard(description: string, question: string) {
  const flags: string[] = []
  const trace: ScoreTraceEntry[] = []
  const lower = description.toLowerCase()

  // Price markets use an objective, publicly auditable price feed — no
  // subjective evidence interpretation needed, so grant a higher baseline.
  const isPriceMarket = PRICE_MARKET_RE.test(question) || PRICE_MARKET_RE.test(description)
  let score = isPriceMarket ? 8 : (description.length > 50 ? 5 : 2)
  trace.push({ rule: isPriceMarket ? 'Price market — objective price feed (no evidence ambiguity)' : description.length > 50 ? 'Baseline (substantive description)' : 'Baseline (thin description)', delta: score })

  const positivePhrases = ['counts as', 'qualifies as', 'is defined as', 'accepted evidence', 'valid evidence']
  const negativePhrases = ['does not count', 'will not be counted', 'excluded', 'not accepted', 'ineligible']

  const pos = positivePhrases.find((p) => lower.includes(p))
  const neg = negativePhrases.find((p) => lower.includes(p))
  const evType = firstMatch(description, EVIDENCE_TYPES)

  if (pos)    { score += 4; trace.push({ rule: 'Defines what counts as evidence', delta: 4, matched: pos }) }
  if (neg)    { score += 3; trace.push({ rule: 'Defines excluded evidence', delta: 3, matched: neg }) }
  if (evType) { score += 3; trace.push({ rule: 'Names acceptable evidence types', delta: 3, matched: evType }) }

  const hasUndefinedConfirmation = lower.includes('confirmation') && !pos
  const hasVagueCredible         = lower.includes('credible sources') && !pos
  if (hasUndefinedConfirmation || hasVagueCredible) {
    score -= 3
    trace.push({ rule: 'Undefined "confirmation"/"credible sources"', delta: -3, matched: hasUndefinedConfirmation ? 'confirmation' : 'credible sources' })
    flags.push('Evidence standard depends on undefined "confirmation" or "credible sources".')
  }

  const capped = Math.max(0, Math.min(15, score))
  const details = capped >= 12
    ? 'Evidence standards are explicitly defined with acceptable and excluded evidence types.'
    : capped >= 8
    ? 'Some evidence guidance is provided; acceptable data sources are referenced.'
    : capped >= 5
    ? 'Evidence standards are implied by context but not formally defined.'
    : 'No evidence standards specified — resolution criteria rely on subjective judgment.'
  return { score: capped, details, flags, trace }
}

// ─── 5. Edge Case Handling (max 15) ──────────────────────────────────────────

function scoreEdgeCaseHandling(question: string, description: string) {
  const flags: string[] = []
  const trace: ScoreTraceEntry[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  // Price markets resolve against a price at a specific time — there is no
  // "cancellation" or "postponement" scenario applicable, so start at 8
  // and skip the short-description penalty.
  const isPriceMarket = PRICE_MARKET_RE.test(question) || PRICE_MARKET_RE.test(description)
  let score = isPriceMarket ? 8 : 5
  trace.push({ rule: isPriceMarket ? 'Price market — no cancellation/postponement risk' : 'Baseline (standard cases assumed)', delta: score })

  if (lower.includes('delay') || lower.includes('delayed') || lower.includes('postpone')) {
    score += 4
    trace.push({ rule: 'Addresses delays/postponement', delta: 4, matched: 'delay' })
  }
  const edge = firstMatch(combined, EDGE_CASE_WORDS)
  if (edge) {
    score += 3
    trace.push({ rule: 'Addresses edge cases', delta: 3, matched: edge })
  }
  const late = firstMatch(combined, LATE_REPORTING_PHRASES)
  if (late) {
    score += 3
    trace.push({ rule: 'Addresses late reporting', delta: 3, matched: late })
  }

  if (!isPriceMarket && description.length < 100 && score === 5) {
    score -= 2
    trace.push({ rule: 'Short description, no edge case coverage', delta: -2 })
    flags.push('Short description with no explicit edge case handling (delays, revisions, cancellations).')
  }

  const capped = Math.max(0, Math.min(15, score))
  const details = capped >= 12
    ? 'Edge cases such as delays, revisions, and cancellations are explicitly addressed.'
    : capped >= 8
    ? 'Some edge cases are considered; postponement or revision scenarios are referenced.'
    : capped >= 5
    ? 'Basic edge cases may be implied but are not explicitly documented in the rules.'
    : 'No edge case handling — unexpected events could lead to disputed resolutions.'
  return { score: capped, details, flags, trace }
}

// ─── 6. Post-Trade Risk (max 10) ─────────────────────────────────────────────

function scorePostHocRisk(description: string, resolutionSource: string, question: string) {
  const flags: string[] = []
  const trace: ScoreTraceEntry[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  let score = 7
  trace.push({ rule: 'Baseline (low retroactive risk)', delta: 7 })

  if (wordCount(description) < 30) {
    score -= 3
    trace.push({ rule: 'Very short description', delta: -3 })
    flags.push('Description is very short — resolution criteria may be underspecified.')
  } else if (wordCount(description) < 60) {
    score -= 1
    trace.push({ rule: 'Short description', delta: -1 })
  }

  if (!resolutionSource || resolutionSource.trim().length === 0) {
    score -= 1
    trace.push({ rule: 'No resolution source', delta: -1 })
  }

  const hasTimingConstraint = lower.includes('by ') || lower.includes('before ') || lower.includes('prior to')
  const postHoc = firstMatch(combined, POST_HOC_TRIGGER_WORDS)
  if (postHoc && !hasTimingConstraint) {
    score -= 2
    trace.push({ rule: 'Post-hoc trigger without timing constraint', delta: -2, matched: postHoc })
    flags.push('Resolution relies on "confirmed" or "announced" without a defined timing constraint.')
  }

  const capped = Math.max(0, Math.min(10, score))
  const details = capped >= 9
    ? 'Resolution criteria are specific enough to minimise post-trade dispute risk.'
    : capped >= 7
    ? 'Post-trade risk is low; resolution depends on publicly verifiable events.'
    : capped >= 5
    ? 'Moderate post-trade risk — some resolution criteria could be interpreted differently.'
    : 'Elevated post-trade risk — vague criteria may invite disputes after resolution.'
  return { score: capped, details, flags, trace }
}

// ─── Risk thresholds ─────────────────────────────────────────────────────────

function getRiskLevel(totalScore: number): RiskLevel {
  if (totalScore >= 75) return 'Low'
  if (totalScore >= 55) return 'Medium'
  if (totalScore >= 38) return 'High'
  return 'Critical'
}

function buildSummary(
  riskLevel: RiskLevel,
  flags: string[],
  totalScore: number,
  breakdown: RuleClarityBreakdown
): string {
  const strongest = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k]) => ({
      timeClarity: 'time clarity',
      resolutionSource: 'resolution source',
      outcomeDefinition: 'outcome definition',
      evidenceStandard: 'evidence standards',
      edgeCaseHandling: 'edge case handling',
      postHocRisk: 'post-trade risk profile',
    }[k]))
    .filter(Boolean)
    .join(' and ')

  if (riskLevel === 'Low') {
    return `Strong rule clarity (${totalScore}/100). This market scores well across ${strongest}. Traders can have high confidence that the resolution criteria are unambiguous and verifiable.`
  }
  if (riskLevel === 'Medium') {
    const topFlag = flags.length > 0 ? ` Note: ${flags[0]}` : ''
    return `Moderate rule clarity (${totalScore}/100). The market is generally well-structured with solid ${strongest}.${topFlag} Ambiguity is limited but traders should review the full resolution criteria before trading.`
  }
  if (riskLevel === 'High') {
    const topFlags = flags.slice(0, 2).join(' ').trim()
    const flagNote = topFlags ? ` Key concerns: ${topFlags}` : ''
    return `Elevated rule clarity risk (${totalScore}/100).${flagNote} Traders should carefully evaluate the resolution criteria before entering a position.`
  }
  const topFlags = flags.slice(0, 2).join(' ').trim()
  return `Critical rule clarity risk (${totalScore}/100). Resolution criteria are substantially underspecified, creating meaningful post-trade dispute potential.${topFlags ? ` Primary concerns: ${topFlags}` : ''}`
}

// ─── Dimension labels (used by score-breakdown UI) ───────────────────────────

export const DIMENSION_LABELS: Record<keyof RuleClarityBreakdown, { label: string; max: number; description: string }> = {
  timeClarity:       { label: 'Time Clarity',       max: 20, description: 'How clearly the resolution deadline and time parameters are defined.' },
  resolutionSource:  { label: 'Resolution Source',  max: 20, description: 'Whether an authoritative, verifiable data source is named.' },
  outcomeDefinition: { label: 'Outcome Definition', max: 20, description: 'How precisely the YES/NO resolution conditions are specified.' },
  evidenceStandard:  { label: 'Evidence Standard',  max: 15, description: 'Whether acceptable and excluded evidence types are documented.' },
  edgeCaseHandling:  { label: 'Edge Case Handling', max: 15, description: 'Coverage of delays, revisions, cancellations, and disputed data.' },
  postHocRisk:       { label: 'Post-Trade Risk',    max: 10, description: 'Risk of retroactive re-interpretation after the market closes.' },
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function calculateRuleClarityScore(params: {
  question: string
  description: string
  resolutionSource: string
  outcomes: string[]
  endDate: string
}): RuleClarityScore {
  const { question, description, resolutionSource, outcomes } = params

  const tc = scoreTimeClarity(question, description)
  const rs = scoreResolutionSource(description, resolutionSource, question)
  const od = scoreOutcomeDefinition(question, description, outcomes)
  const es = scoreEvidenceStandard(description, question)
  const ec = scoreEdgeCaseHandling(question, description)
  const ph = scorePostHocRisk(description, resolutionSource, question)

  const breakdown: RuleClarityBreakdown = {
    timeClarity:       tc.score,
    resolutionSource:  rs.score,
    outcomeDefinition: od.score,
    evidenceStandard:  es.score,
    edgeCaseHandling:  ec.score,
    postHocRisk:       ph.score,
  }

  const totalScore = Math.min(100, Object.values(breakdown).reduce((s, v) => s + v, 0))
  const allFlags   = [...tc.flags, ...rs.flags, ...od.flags, ...es.flags, ...ec.flags, ...ph.flags]
  const riskLevel  = getRiskLevel(totalScore)

  return {
    totalScore,
    riskLevel,
    breakdown,
    flags: allFlags,
    summary: buildSummary(riskLevel, allFlags, totalScore, breakdown),
    dimensionDetails: {
      timeClarity:       tc.details,
      resolutionSource:  rs.details,
      outcomeDefinition: od.details,
      evidenceStandard:  es.details,
      edgeCaseHandling:  ec.details,
      postHocRisk:       ph.details,
    },
    trace: {
      timeClarity:       tc.trace,
      resolutionSource:  rs.trace,
      outcomeDefinition: od.trace,
      evidenceStandard:  es.trace,
      edgeCaseHandling:  ec.trace,
      postHocRisk:       ph.trace,
    },
  }
}
