import type { RuleClarityScore, RuleClarityBreakdown, RiskLevel } from './types'

// ─── Vocabulary lists ────────────────────────────────────────────────────────

const TIMEZONE_WORDS = ['ET', 'UTC', 'Eastern Time', 'GMT', 'EST', 'EDT', 'PT', 'CT', 'MT']
const TIME_ANCHOR_WORDS = ['by', 'before', 'after', 'between', 'until', 'no later than', 'at least']
const OFFICIAL_SOURCE_WORDS = [
  'official', 'government', 'SEC', 'company announcement', 'filing', 'court',
  'FIFA', 'Federal Reserve', 'BLS', 'CPI', 'on-chain', 'USDA', 'WHO', 'FDA',
]
const VAGUE_SOURCE_WORDS = ['credible reporting', 'reliable sources', 'consensus', 'substantial evidence', 'widely reported']
const EVIDENCE_TYPES = ['screenshots', 'official statements', 'filings', 'data providers', 'on-chain transactions', 'published reports', 'press release']
const AMBIGUOUS_WORDS = ['significant', 'major', 'substantial', 'likely', 'reportedly', 'effectively']
const LATE_REPORTING_PHRASES = [
  'after the deadline', 'late reporting', 'reported after', 'disclosed after',
  'published after', 'retroactive', 'prior to resolution',
]
const EDGE_CASE_WORDS = [
  'revision', 'revisions', 'correction', 'corrections', 'cancellation', 'cancellations',
  'postponement', 'postponements', 'dispute', 'disputes', 'walkover', 'forfeit',
]
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
// Fixed: separate timezone check from time-anchor penalty; give points for
// absolute date references regardless of vague time anchors.

function scoreTimeClarity(question: string, description: string): { score: number; flags: string[] } {
  const flags: string[] = []
  let score = 0

  if (!description || description.trim().length < 10) {
    flags.push('No description provided — time parameters cannot be evaluated.')
    return { score: 0, flags }
  }

  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  // +6  if description mentions a specific date or year (e.g. "2025", "January")
  const hasSpecificDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b20\d{2}\b/i.test(combined)
  if (hasSpecificDate) score += 6

  // +4  if an explicit time anchor is used ("by", "before", "after", …)
  const hasTimeAnchor = includes(combined, TIME_ANCHOR_WORDS)
  if (hasTimeAnchor) score += 4

  // +6  if a timezone is specified — independent of time anchor
  if (includes(combined, TIMEZONE_WORDS)) {
    score += 6
  } else if (hasTimeAnchor) {
    // Penalty only when a time anchor is present BUT no timezone — not always
    score -= 3
    flags.push('Time-sensitive language used without timezone specification.')
  }

  // +4  if resolution refers to an official report/announcement/filing as the time trigger
  if (lower.includes('announcement') || lower.includes('disclosure') ||
      lower.includes('report') || lower.includes('filing')) {
    score += 4
  }

  return { score: Math.max(0, Math.min(20, score)), flags }
}

// ─── 2. Resolution Source (max 20) ───────────────────────────────────────────

function scoreResolutionSource(description: string, resolutionSource: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []

  if (resolutionSource && resolutionSource.trim().length > 0) {
    score += 10
    // Extra +2 if it looks like a URL (a real link, not "N/A")
    if (/https?:\/\//.test(resolutionSource)) score += 2
  } else {
    flags.push('No resolution source specified.')
  }

  if (includes(description, OFFICIAL_SOURCE_WORDS)) score += 5

  // +3 if a fallback/hierarchy is described ("in the event", "primary", "secondary")
  const lower = description.toLowerCase()
  if (lower.includes('primary') || lower.includes('secondary') ||
      lower.includes('hierarchy') || lower.includes('in the event')) {
    score += 3
  }

  if (includes(description, VAGUE_SOURCE_WORDS)) {
    score -= 5
    flags.push('Resolution source relies on vague terms (e.g. "credible reporting", "substantial evidence").')
  }

  return { score: Math.max(0, Math.min(20, score)), flags }
}

// ─── 3. Outcome Definition (max 20) ──────────────────────────────────────────

function scoreOutcomeDefinition(question: string, description: string, outcomes: string[]): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []

  // +8 for a well-scoped question (not empty, not a wall of text)
  if (question.length > 0 && question.length <= 200) {
    score += 8
  } else if (question.length > 200) {
    flags.push('Question exceeds 200 characters — may be difficult to parse.')
    score += 4
  }

  // +4 for standard binary Yes/No outcomes
  const isBinary =
    outcomes.length === 2 &&
    outcomes.some((o) => o.toLowerCase() === 'yes') &&
    outcomes.some((o) => o.toLowerCase() === 'no')
  if (isBinary) score += 4

  // +6 if description explicitly defines what constitutes a YES resolution
  const lower = description.toLowerCase()
  if (lower.includes('resolv') && (lower.includes('yes') || lower.includes('will resolve'))) {
    score += 6
  } else if (description.length > 80) {
    score += 3
  }

  // Penalty for genuinely ambiguous language — but only words that introduce
  // real measurement ambiguity, NOT neutral reporting verbs like "confirmed"
  if (includes(question, AMBIGUOUS_WORDS) || includes(description, AMBIGUOUS_WORDS)) {
    score -= 4
    flags.push('Question or description contains ambiguous language (e.g. "significant", "major", "reportedly").')
  }

  return { score: Math.max(0, Math.min(20, score)), flags }
}

// ─── 4. Evidence Standard (max 15) ───────────────────────────────────────────
// Fixed: broken || operator precedence that caused the penalty to fire on
// almost every market. Rewritten with explicit boolean variables.

function scoreEvidenceStandard(description: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []
  const lower = description.toLowerCase()

  const positivePhrases = ['counts as', 'qualifies as', 'is defined as', 'accepted evidence', 'valid evidence']
  const negativePhrases = ['does not count', 'will not be counted', 'excluded', 'not accepted', 'ineligible']

  const hasPositive = positivePhrases.some((p) => lower.includes(p))
  const hasNegative = negativePhrases.some((p) => lower.includes(p))
  const hasEvidenceTypes = includes(description, EVIDENCE_TYPES)

  if (hasPositive) score += 5
  if (hasNegative) score += 5
  if (hasEvidenceTypes) score += 5

  // Penalty only when there is an undefined confirmation/source reference
  // AND the market has NOT provided a positive definition — evaluated separately
  const hasUndefinedConfirmation = lower.includes('confirmation') && !hasPositive
  const hasVagueCredible = lower.includes('credible sources') && !hasPositive

  if (hasUndefinedConfirmation || hasVagueCredible) {
    score -= 5
    flags.push('Evidence standard depends on undefined "confirmation" or "credible sources".')
  }

  return { score: Math.max(0, Math.min(15, score)), flags }
}

// ─── 5. Edge Case Handling (max 15) ──────────────────────────────────────────
// Fixed: removed the catch-all penalty for ANY market with a time anchor (i.e.
// almost every market). Penalty now fires only when the description is short
// AND no edge cases are addressed at all.

function scoreEdgeCaseHandling(question: string, description: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  // +5 for delay/postponement language
  if (lower.includes('delay') || lower.includes('delayed') || lower.includes('postpone')) {
    score += 5
  }

  // +5 for revision/correction/cancellation coverage
  if (includes(combined, EDGE_CASE_WORDS)) {
    score += 5
  }

  // +5 for late-reporting / post-deadline disclosure handling
  if (includes(combined, LATE_REPORTING_PHRASES)) {
    score += 5
  } else if (description.length < 150 && score === 0) {
    // Penalty only when description is very short AND no edge cases addressed at all
    score -= 3
    flags.push('Short description with no edge case handling (delays, revisions, cancellations).')
  }

  return { score: Math.max(0, Math.min(15, score)), flags }
}

// ─── 6. Post-Trade Risk (max 10) ─────────────────────────────────────────────

function scorePostHocRisk(description: string, resolutionSource: string, question: string): { score: number; flags: string[] } {
  let score = 10
  const flags: string[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  // Descriptions under 150 words are likely underspecified
  if (wordCount(description) < 40) {
    score -= 4
    flags.push('Description is very short — resolution criteria may be underspecified.')
  } else if (wordCount(description) < 80) {
    score -= 2
  }

  if (!resolutionSource || resolutionSource.trim().length === 0) {
    score -= 2
  }

  // Penalty when resolution hinges on post-hoc announcements without a timing
  // constraint to prevent retroactive re-interpretation
  const hasTimingConstraint = lower.includes('by ') || lower.includes('before ') || lower.includes('prior to')
  const hasPostHocWord = includes(combined, POST_HOC_TRIGGER_WORDS)

  if (hasPostHocWord && !hasTimingConstraint) {
    score -= 3
    flags.push('Resolution relies on "confirmed" or "announced" without a defined timing constraint.')
  }

  return { score: Math.max(0, score), flags }
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function getRiskLevel(totalScore: number): RiskLevel {
  if (totalScore >= 80) return 'Low'
  if (totalScore >= 60) return 'Medium'
  if (totalScore >= 40) return 'High'
  return 'Critical'
}

function buildSummary(riskLevel: RiskLevel, flags: string[], totalScore: number): string {
  if (riskLevel === 'Low') {
    return `This market demonstrates strong rule clarity (score: ${totalScore}/100). Resolution criteria are well-defined with minimal ambiguity.`
  }
  if (riskLevel === 'Medium') {
    return `This market has moderate rule clarity (score: ${totalScore}/100). Some ambiguity is present but the resolution framework is largely specified.`
  }
  if (riskLevel === 'High') {
    const topFlag = flags[0] ? ` Key issue: ${flags[0]}` : ''
    return `This market has significant rule clarity concerns (score: ${totalScore}/100).${topFlag}`
  }
  return `This market carries critical rule clarity risk (score: ${totalScore}/100). Resolution criteria are substantially underspecified, creating high post-trade dispute potential.`
}

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
    timeClarity: tc.score,
    resolutionSource: rs.score,
    outcomeDefinition: od.score,
    evidenceStandard: es.score,
    edgeCaseHandling: ec.score,
    postHocRisk: ph.score,
  }

  const totalScore = Math.min(
    100,
    tc.score + rs.score + od.score + es.score + ec.score + ph.score
  )

  const allFlags = [...tc.flags, ...rs.flags, ...od.flags, ...es.flags, ...ec.flags, ...ph.flags]
  const riskLevel = getRiskLevel(totalScore)

  return {
    totalScore,
    riskLevel,
    breakdown,
    flags: allFlags,
    summary: buildSummary(riskLevel, allFlags, totalScore),
  }
}
