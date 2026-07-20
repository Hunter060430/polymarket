import { describe, expect, it } from 'vitest'
import { calculateLiquidityScore, calculateRegulatorySensitivity } from './market-signals'
import { calculateRuleClarityScore } from './rule-clarity-score'

describe('regulatory sensitivity', () => {
  it('marks explicit state-on-state invasion as critical', () => {
    const result = calculateRegulatorySensitivity({ question: 'Will the US invade Iran?' })
    expect(result.level).toBe('Critical')
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.reasons).toContain('State-on-state military escalation')
  })

  it('keeps ordinary price markets low', () => {
    expect(calculateRegulatorySensitivity({ question: 'Will Bitcoin reach $100,000?' }).level).toBe('Low')
  })
})

describe('liquidity score', () => {
  it('rewards deep, actively traded markets', () => {
    const result = calculateLiquidityScore({ liquidity: 500_000, volume: 10_000_000, volume24hr: 1_000_000, bestBid: 0.49, bestAsk: 0.51, spread: 0.02 })
    expect(result.score).toBeGreaterThanOrEqual(70)
  })
})

describe('rule clarity score', () => {
  it('scores complete objective rules higher than empty rules', () => {
    const complete = calculateRuleClarityScore({ question: 'Will BTC close above $100,000 by December 31, 2026 at 11:59 PM ET?', description: 'This market will resolve Yes using the official Coinbase closing price. Corrections reported after the deadline do not count.', resolutionSource: 'https://coinbase.com', outcomes: ['Yes', 'No'], endDate: '2026-12-31' })
    const empty = calculateRuleClarityScore({ question: 'Will it happen?', description: '', resolutionSource: '', outcomes: ['Yes', 'No'], endDate: '' })
    expect(complete.totalScore).toBeGreaterThan(empty.totalScore)
  })
})
