// lib/similarity.ts
// Keyword-based TF-IDF–style similarity for finding semantically related markets.
// No vector DB required — runs fully in-process on the cached market list.

import type { NormalizedMarket } from './types'

const STOP_WORDS = new Set([
  'a','an','the','and','or','of','in','on','at','to','for','is','will','by',
  'be','are','was','were','has','have','had','it','this','that','with','from',
  'as','at','if','not','no','but','so','do','its','any','all','more','than',
  'market','resolve','resolves','resolved','yes','no','before','after','between',
  'during','when','which','who','what','how','per','over','under','about','into',
  'based','using','via','can','would','could','should','may','might',
])

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
  return tf
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0
  for (const [t, v] of a) {
    dot   += v * (b.get(t) ?? 0)
    normA += v * v
  }
  for (const [, v] of b) normB += v * v
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export interface SimilarMarket {
  market: NormalizedMarket
  similarity: number  // 0–1
  sharedTerms: string[]
}

export function findSimilarMarkets(
  target: NormalizedMarket,
  pool: NormalizedMarket[],
  topN = 5,
): SimilarMarket[] {
  const targetText = `${target.question} ${target.description ?? ''} ${target.eventCategory ?? ''}`
  const targetTokens = tokenise(targetText)
  const targetTF = termFreq(targetTokens)

  const results: SimilarMarket[] = []

  for (const m of pool) {
    if (m.marketId === target.marketId) continue
    const mText = `${m.question} ${m.description ?? ''} ${m.eventCategory ?? ''}`
    const mTokens = tokenise(mText)
    const mTF = termFreq(mTokens)

    const sim = cosineSimilarity(targetTF, mTF)
    if (sim < 0.05) continue   // Skip noise-level matches

    // Compute shared meaningful terms for display
    const sharedTerms = Array.from(targetTF.keys())
      .filter((t) => mTF.has(t) && t.length > 3)
      .sort((a, b) => (targetTF.get(b) ?? 0) - (targetTF.get(a) ?? 0))
      .slice(0, 4)

    results.push({ market: m, similarity: sim, sharedTerms })
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
}
