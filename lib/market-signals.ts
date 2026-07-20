import type {
  LiquidityScore,
  RegulatorySensitivityScore,
  RiskLevel,
} from '@/lib/types'

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function sensitivityLevel(score: number): RiskLevel {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

function executionRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'Low'
  if (score >= 50) return 'Medium'
  if (score >= 25) return 'High'
  return 'Critical'
}

const REGULATORY_SIGNALS: Array<{
  label: string
  weight: number
  pattern: RegExp
}> = [
  { label: 'Election or political office', weight: 30, pattern: /\b(election|electoral|president|prime minister|governor|senate|congress|parliament|vote count|ballot)\b/i },
  { label: 'Government or regulator action', weight: 26, pattern: /\b(cftc|sec|fda|doj|ftc|federal reserve|central bank|government|regulator|regulation|executive order|sanction)\b/i },
  { label: 'Court or legal ruling', weight: 25, pattern: /\b(court|supreme court|judge|ruling|verdict|lawsuit|indict|convict|sentence|appeal|legal challenge)\b/i },
  { label: 'Named public official', weight: 18, pattern: /\b(trump|biden|harris|putin|zelensky|netanyahu|modi|starmer|macron|xi jinping|khamenei|pezeshkian|erdogan|lula|milei)\b/i },
  { label: 'War or geopolitical intervention', weight: 18, pattern: /\b(war|invasion|ceasefire|military strike|troops|territory|nato|united nations)\b/i },
  { label: 'Policy implementation dependency', weight: 16, pattern: /\b(pass a bill|legislation|law signed|ban|approve|authorization|government shutdown|tariff)\b/i },
  { label: 'Sensitive financial enforcement', weight: 14, pattern: /\b(crypto ban|securities law|enforcement action|license|licensed exchange|investigation)\b/i },
]

export function calculateRegulatorySensitivity(input: {
  question: string
  description?: string
  category?: string
}): RegulatorySensitivityScore {
  const text = `${input.question} ${input.description ?? ''} ${input.category ?? ''}`
  const matched = REGULATORY_SIGNALS.filter((signal) => signal.pattern.test(text))
  const score = clamp(matched.reduce((total, signal) => total + signal.weight, 0))

  return {
    score,
    level: sensitivityLevel(score),
    reasons: matched.length > 0
      ? matched.map((signal) => signal.label).slice(0, 4)
      : ['No material regulatory dependency detected'],
  }
}

export function calculateLiquidityScore(input: {
  liquidity: number
  volume24hr: number
  volume: number
  bestBid?: number | null
  bestAsk?: number | null
  spread?: number | null
}): LiquidityScore {
  const explicitSpread = input.spread != null && input.spread >= 0 ? input.spread : null
  const quotedSpread = input.bestBid != null && input.bestAsk != null && input.bestAsk >= input.bestBid
    ? input.bestAsk - input.bestBid
    : null
  const spread = explicitSpread ?? quotedSpread
  const turnover24h = input.liquidity > 0 ? input.volume24hr / input.liquidity : 0

  let score = 0
  const reasons: string[] = []

  if (input.liquidity >= 100_000) {
    score += 35
    reasons.push('Deep available liquidity')
  } else if (input.liquidity >= 25_000) {
    score += 27
    reasons.push('Healthy available liquidity')
  } else if (input.liquidity >= 5_000) {
    score += 17
    reasons.push('Moderate available liquidity')
  } else if (input.liquidity > 0) {
    score += 7
    reasons.push('Thin available liquidity')
  } else {
    reasons.push('No liquidity depth reported')
  }

  if (turnover24h >= 1) {
    score += 30
    reasons.push('Strong 24h turnover')
  } else if (turnover24h >= 0.25) {
    score += 22
    reasons.push('Active 24h turnover')
  } else if (turnover24h >= 0.05) {
    score += 12
    reasons.push('Light 24h turnover')
  } else {
    reasons.push('Low 24h turnover')
  }

  if (input.volume >= 1_000_000) score += 20
  else if (input.volume >= 100_000) score += 14
  else if (input.volume >= 10_000) score += 8

  if (spread != null) {
    if (spread <= 0.01) {
      score += 15
      reasons.push('Tight quoted spread')
    } else if (spread <= 0.03) {
      score += 10
      reasons.push('Moderate quoted spread')
    } else if (spread <= 0.08) {
      score += 4
      reasons.push('Wide quoted spread')
    } else {
      reasons.push('Very wide quoted spread')
    }
  } else {
    reasons.push('Bid/ask spread unavailable')
  }

  const normalizedScore = clamp(score)
  return {
    score: normalizedScore,
    level: executionRiskLevel(normalizedScore),
    spread,
    turnover24h,
    reasons: reasons.slice(0, 4),
  }
}
