import type { RuleClarityScore, RuleClarityBreakdown, RiskLevel } from './types'

const TIME_WORDS = ['before', 'by', 'after', 'on', 'between', 'until']
const TIMEZONE_WORDS = ['ET', 'UTC', 'Eastern Time', 'GMT', 'EST', 'EDT']
const OFFICIAL_SOURCE_WORDS = [
  'official',
  'government',
  'SEC',
  'company announcement',
  'filing',
  'court',
  'FIFA',
  'Federal Reserve',
  'BLS',
  'CPI',
  'on-chain',
]
const VAGUE_SOURCE_WORDS = ['credible reporting', 'reliable sources', 'consensus', 'substantial evidence']
const EVIDENCE_TYPES = ['screenshots', 'official statements', 'filings', 'data providers', 'on-chain transactions', 'published reports']
const AMBIGUOUS_WORDS = ['significant', 'major', 'substantial', 'likely', 'confirmed', 'reportedly', 'effectively']
const EDGE_CASE_WORDS = ['revision', 'revisions', 'correction', 'corrections', 'cancellation', 'cancellations', 'postponement', 'postponements', 'dispute', 'disputes']
const POST_HOC_TRIGGER_WORDS = ['confirmed', 'announced', 'reported', 'official']

function includes(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase()
  return terms.some((t) => lower.includes(t.toLowerCase()))
}

function scoreTimeClarity(question: string, description: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []
  const combined = `${question} ${description}`

  if (!description) {
    score = 0
    flags.push('No description provided — time parameters cannot be evaluated.')
    return { score, flags }
  }

  if (includes(combined, TIME_WORDS)) {
    score += 5
  }

  if (includes(description, TIMEZONE_WORDS)) {
    score += 5
  } else if (includes(combined, TIME_WORDS)) {
    score -= 5
    flags.push('Time-sensitive language used without timezone specification.')
  }

  if (
    description.toLowerCase().includes('announcement') ||
    description.toLowerCase().includes('disclosure') ||
    description.toLowerCase().includes('report') ||
    description.toLowerCase().includes('filing')
  ) {
    score += 4
  }

  return { score: Math.max(0, Math.min(20, score)), flags }
}

function scoreResolutionSource(description: string, resolutionSource: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []

  if (resolutionSource && resolutionSource.trim().length > 0) {
    score += 10
  } else {
    flags.push('No resolution source specified.')
  }

  if (includes(description, OFFICIAL_SOURCE_WORDS)) {
    score += 5
  }

  if (
    description.toLowerCase().includes('primary') ||
    description.toLowerCase().includes('secondary') ||
    description.toLowerCase().includes('hierarchy') ||
    description.toLowerCase().includes('in the event')
  ) {
    score += 5
  }

  if (includes(description, VAGUE_SOURCE_WORDS)) {
    score -= 5
    flags.push('Resolution source relies on vague terms (e.g. "credible reporting", "substantial evidence").')
  }

  return { score: Math.max(0, Math.min(20, score)), flags }
}

function scoreOutcomeDefinition(question: string, description: string, outcomes: string[]): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []

  if (question.length > 0 && question.length <= 180) {
    score += 8
  } else if (question.length > 180) {
    flags.push('Question exceeds 180 characters — may be difficult to parse.')
  }

  const isBinary =
    outcomes.length === 2 &&
    outcomes.some((o) => o.toLowerCase() === 'yes') &&
    outcomes.some((o) => o.toLowerCase() === 'no')

  if (isBinary) {
    score += 6
  }

  if (description && description.toLowerCase().includes('yes') && description.toLowerCase().includes('resolv')) {
    score += 6
  } else if (description && description.length > 50) {
    score += 3
  }

  if (includes(question, AMBIGUOUS_WORDS) || includes(description, AMBIGUOUS_WORDS)) {
    score -= 5
    flags.push('Question or description contains ambiguous language (e.g. "significant", "major", "reportedly").')
  }

  return { score: Math.max(0, Math.min(20, score)), flags }
}

function scoreEvidenceStandard(description: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []

  const lower = description.toLowerCase()

  const positivePhrases = ['counts as', 'qualifies as', 'is defined as', 'accepted evidence', 'valid evidence']
  const negativePhrases = ['does not count', 'will not be counted', 'excluded', 'not accepted', 'ineligible']

  if (positivePhrases.some((p) => lower.includes(p))) {
    score += 5
  }

  if (negativePhrases.some((p) => lower.includes(p))) {
    score += 5
  }

  if (includes(description, EVIDENCE_TYPES)) {
    score += 5
  }

  if (
    lower.includes('confirmation') && !positivePhrases.some((p) => lower.includes(p)) ||
    lower.includes('credible sources') && !positivePhrases.some((p) => lower.includes(p))
  ) {
    score -= 5
    flags.push('Evidence standard depends on undefined "confirmation" or "credible sources".')
  }

  return { score: Math.max(0, Math.min(15, score)), flags }
}

function scoreEdgeCaseHandling(question: string, description: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []
  const combined = `${question} ${description}`
  const lower = combined.toLowerCase()

  if (lower.includes('delay') || lower.includes('delayed')) {
    score += 5
  }

  if (includes(combined, EDGE_CASE_WORDS)) {
    score += 5
  }

  if (
    lower.includes('after the deadline') ||
    lower.includes('late reporting') ||
    lower.includes('reported after') ||
    lower.includes('disclosed after') ||
    lower.includes('published after')
  ) {
    score += 5
  } else if (includes(combined, TIME_WORDS)) {
    score -= 5
    flags.push('Market is time-sensitive but does not address late reporting or delayed disclosure.')
  }

  return { score: Math.max(0, Math.min(15, score)), flags }
}

function scorePostHocRisk(description: string, resolutionSource: string, question: string): { score: number; flags: string[] } {
  let score = 10
  const flags: string[] = []
  const combined = `${question} ${description}`

  if (description.length < 250) {
    score -= 4
    flags.push('Description is very short — resolution criteria may be underspecified.')
  }

  if (!resolutionSource || resolutionSource.trim().length === 0) {
    score -= 3
  }

  if (includes(combined, POST_HOC_TRIGGER_WORDS) && !description.toLowerCase().includes('by ')) {
    score -= 3
    flags.push('Resolution relies on "confirmed", "announced", or "reported" without a defined timing constraint.')
  }

  return { score: Math.max(0, score), flags }
}

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
    return `This market has significant rule clarity concerns (score: ${totalScore}/100). Key issues: ${flags.slice(0, 2).join(' ')}`
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
