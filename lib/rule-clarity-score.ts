import type { RuleClarityScore, RuleClarityBreakdown, RiskLevel } from './types'

// ─── Vocabulary lists ────────────────────────────────────────────────────────

const TIMEZONE_WORDS   = ['ET', 'UTC', 'Eastern Time', 'GMT', 'EST', 'EDT', 'PT', 'CT', 'MT']
const TIME_ANCHOR_WORDS = ['by', 'before', 'after', 'between', 'until', 'no later than', 'at least']
const OFFICIAL_SOURCE_WORDS = [
  'official', 'government', 'SEC', 'company announcement', 'filing', 'court',
  'FIFA', 'Federal Reserve', 'BLS', 'CPI', 'on-chain', 'USDA', 'WHO', 'FDA',
  'CME', 'CFTC', 'Treasury', 'census', 'congressional',
]
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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ─── 1. Time Clarity (max 20) ────────────────────────────────────────────────
// Generous baseline: most markets with a question + description get a decent
// starting score. Bonuses for specificity; minor penalty for vagueness only.

function scoreTimeClarity(question: string, description: string): { score: number; details: string; flags: string[] } {
  const flags: string[] = []
  const combined = `${question} ${description}`

  // Baseline: 10 points just for having a question with a date reference
  let score = 10

  // +4 if a specific month or year is named
  const hasSpecificDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b20\d{2}\b/i.test(combined)
  if (hasSpecificDate) score += 4

  // +3 if an explicit time anchor is used
  if (includes(combined, TIME_ANCHOR_WORDS)) score += 3

  // +3 if timezone specified (independent of time anchor)
  if (includes(combined, TIMEZONE_WORDS)) {
    score += 3
  } else if (includes(combined, TIME_ANCHOR_WORDS)) {
    // Minor penalty: time anchor without timezone
    score -= 1
    flags.push('Time-sensitive language used without explicit timezone.')
  }

  // Penalty for no description at all
  if (!description || description.trim().length < 10) {
    score -= 5
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
  return { score: capped, details, flags }
}

// ─── 2. Resolution Source (max 20) ───────────────────────────────────────────

function scoreResolutionSource(description: string, resolutionSource: string): { score: number; details: string; flags: string[] } {
  const flags: string[] = []

  // Baseline: 8 points for any non-empty source
  let score = resolutionSource && resolutionSource.trim().length > 0 ? 8 : 4

  if (!resolutionSource || resolutionSource.trim().length === 0) {
    flags.push('No explicit resolution source URL or reference provided.')
  } else if (/https?:\/\//.test(resolutionSource)) {
    // Named URL is the gold standard
    score += 4
  }

  if (includes(description, OFFICIAL_SOURCE_WORDS)) score += 5

  const lower = description.toLowerCase()
  if (lower.includes('primary') || lower.includes('secondary') || lower.includes('in the event')) {
    score += 3
  }

  if (includes(description, VAGUE_SOURCE_WORDS)) {
    score -= 3
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
  return { score: capped, details, flags }
}

// ─── 3. Outcome Definition (max 20) ──────────────────────────────────────────

function scoreOutcomeDefinition(question: string, description: string, outcomes: string[]): { score: number; details: string; flags: string[] } {
  const flags: string[] = []

  // Baseline: 8 points for a valid question
  let score = question.length > 0 ? 8 : 2

  if (question.length > 200) {
    flags.push('Question is very long — may be difficult to parse at a glance.')
    score += 2
  }

  const isBinary =
    outcomes.length === 2 &&
    outcomes.some((o) => o.toLowerCase() === 'yes') &&
    outcomes.some((o) => o.toLowerCase() === 'no')
  if (isBinary) score += 4

  const lower = description.toLowerCase()
  if (lower.includes('resolv') && (lower.includes('yes') || lower.includes('will resolve'))) {
    score += 6
  } else if (description.length > 80) {
    score += 3
  }

  if (includes(question, AMBIGUOUS_WORDS) || includes(description, AMBIGUOUS_WORDS)) {
    score -= 3
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
  return { score: capped, details, flags }
}

// ─── 4. Evidence Standard (max 15) ───────────────────────────────────────────

function scoreEvidenceStandard(description: string): { score: number; details: string; flags: string[] } {
  const flags: string[] = []
  const lower = description.toLowerCase()

  // Baseline: 5 points for any description that has substance
  let score = description.length > 50 ? 5 : 2

  const positivePhrases = ['counts as', 'qualifies as', 'is defined as', 'accepted evidence', 'valid evidence']
  const negativePhrases = ['does not count', 'will not be counted', 'excluded', 'not accepted', 'ineligible']

  const hasPositive = positivePhrases.some((p) => lower.includes(p))
  const hasNegative = negativePhrases.some((p) => lower.includes(p))
  const hasEvidenceTypes = includes(description, EVIDENCE_TYPES)

  if (hasPositive)     score += 4
  if (hasNegative)     score += 3
  if (hasEvidenceTypes) score += 3

  const hasUndefinedConfirmation = lower.includes('confirmation') && !hasPositive
  const hasVagueCredible         = lower.includes('credible sources') && !hasPositive

  if (hasUndefinedConfirmation || hasVagueCredible) {
    score -= 3
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
  return { score: capped, details, flags }
}

// ─── 5. Edge Case Handling (max 15) ──────────────────────────────────────────

function scoreEdgeCaseHandling(question: string, description: string): { score: number; details: string; flags: string[] } {
  const flags: string[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  // Baseline: 5 points — most markets implicitly handle standard cases
  let score = 5

  if (lower.includes('delay') || lower.includes('delayed') || lower.includes('postpone')) {
    score += 4
  }
  if (includes(combined, EDGE_CASE_WORDS)) {
    score += 3
  }
  if (includes(combined, LATE_REPORTING_PHRASES)) {
    score += 3
  }

  // Small penalty only for very short descriptions with zero edge case coverage
  if (description.length < 100 && score === 5) {
    score -= 2
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
  return { score: capped, details, flags }
}

// ─── 6. Post-Trade Risk (max 10) ─────────────────────────────────────────────

function scorePostHocRisk(description: string, resolutionSource: string, question: string): { score: number; details: string; flags: string[] } {
  const flags: string[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  // Baseline: 7 points — most markets are not retroactively disputed
  let score = 7

  if (wordCount(description) < 30) {
    score -= 3
    flags.push('Description is very short — resolution criteria may be underspecified.')
  } else if (wordCount(description) < 60) {
    score -= 1
  }

  if (!resolutionSource || resolutionSource.trim().length === 0) {
    score -= 1
  }

  const hasTimingConstraint = lower.includes('by ') || lower.includes('before ') || lower.includes('prior to')
  const hasPostHocWord      = includes(combined, POST_HOC_TRIGGER_WORDS)

  if (hasPostHocWord && !hasTimingConstraint) {
    score -= 2
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
  return { score: capped, details, flags }
}

// ─── Risk thresholds ─────────────────────────────────────────────────────────
// Calibrated so that a typical well-written binary market scores 55–75 (Medium)
// and only markets with genuinely poor specs fall below 40 (High/Critical).

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
  const rs = scoreResolutionSource(description, resolutionSource)
  const od = scoreOutcomeDefinition(question, description, outcomes)
  const es = scoreEvidenceStandard(description)
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
  }
}
