export interface PolymarketMarket {
  id: string
  slug: string
  question: string
  description?: string
  resolutionSource?: string
  endDate?: string
  volume?: string | number
  liquidity?: string | number
  outcomes?: string
  outcomePrices?: string
  conditionId?: string
  clobTokenIds?: string
  active?: boolean
  closed?: boolean
  // Market dynamics (Gamma API)
  oneDayPriceChange?: number
  volume24hr?: string | number
  // Oracle / resolution (UMA) — present on some Gamma responses
  umaResolutionStatus?: string
  umaBond?: string | number
  umaReward?: string | number
  hasReviewedDates?: boolean
  resolvedBy?: string
  umaEndDate?: string
}

export interface PolymarketEvent {
  id: string
  title?: string
  slug?: string
  category?: string
  markets?: PolymarketMarket[]
  active?: boolean
  closed?: boolean
}

export interface RuleClarityBreakdown {
  timeClarity: number
  resolutionSource: number
  outcomeDefinition: number
  evidenceStandard: number
  edgeCaseHandling: number
  postHocRisk: number
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

// A single rule that fired during scoring — used to show users *why* a
// dimension received the score it did (the "scoring trace").
export interface ScoreTraceEntry {
  rule: string      // human-readable rule name
  delta: number     // points added (+) or removed (-)
  matched?: string  // the word/phrase or condition that triggered it
}

export interface RuleClarityScore {
  totalScore: number
  riskLevel: RiskLevel
  breakdown: RuleClarityBreakdown
  flags: string[]
  summary: string
  dimensionDetails?: Record<keyof RuleClarityBreakdown, string>
  trace?: Record<keyof RuleClarityBreakdown, ScoreTraceEntry[]>
}

export interface NormalizedMarket {
  eventId: string
  eventTitle: string
  eventSlug: string
  eventCategory: string
  marketId: string
  marketSlug: string
  question: string
  description: string
  resolutionSource: string
  endDate: string
  volume: number
  liquidity: number
  outcomes: string[]
  outcomePrices: number[]
  conditionId: string
  clobTokenIds: string[]
  active: boolean
  closed: boolean
  score: RuleClarityScore
  // Market dynamics
  oneDayPriceChange: number   // signed fraction, e.g. +0.052 = +5.2pp
  volume24hr: number
  // Oracle / resolution metadata (may be empty when Gamma omits it)
  oracle: {
    resolvedBy: string          // e.g. "UMA Optimistic Oracle" or ''
    umaResolutionStatus: string // e.g. "resolved", "disputed", or ''
    hasDisputeSignal: boolean    // true when status indicates a dispute/challenge
  }
}

export interface MarketsApiResponse {
  scannedAt: string
  eventCount: number
  marketCount: number
  markets: NormalizedMarket[]
}
