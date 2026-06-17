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

export interface RuleClarityScore {
  totalScore: number
  riskLevel: RiskLevel
  breakdown: RuleClarityBreakdown
  flags: string[]
  summary: string
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
}

export interface MarketsApiResponse {
  scannedAt: string
  eventCount: number
  marketCount: number
  markets: NormalizedMarket[]
}
