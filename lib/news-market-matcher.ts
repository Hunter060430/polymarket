import type { NormalizedMarket } from '@/lib/types'

export interface MatchableNewsPost {
  id: number
  slug: string
  title: string
  summary: string
  body?: string
  category: string
  publishedAt: Date | null
  authorName?: string
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'before', 'being', 'between', 'could',
  'from', 'have', 'into', 'market', 'markets', 'more', 'polymarket', 'than',
  'that', 'their', 'there', 'these', 'they', 'this', 'through', 'under', 'what',
  'when', 'where', 'which', 'while', 'will', 'with', 'would', 'year', 'news',
  'industry', 'global', 'regulatory', 'regulation', 'platform', 'trading',
  'prediction', 'forecasting', 'financial', 'company', 'exchange',
])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map((word) => word.replace(/^-|-$/g, ''))
      .filter((word) => word.length >= 4 && !/^\d+$/.test(word) && !STOP_WORDS.has(word)),
  )
}

function overlapScore(left: Set<string>, right: Set<string>) {
  let score = 0
  for (const token of left) {
    if (right.has(token)) score += token.length >= 8 ? 3 : token.length >= 6 ? 2 : 1
  }
  return score
}

export function findMarketsForNews(
  post: MatchableNewsPost,
  markets: NormalizedMarket[],
  limit = 4,
): NormalizedMarket[] {
  const titleTokens = tokenize(post.title)
  const contentTokens = tokenize(`${post.summary} ${post.body ?? ''}`)

  return markets
    .map((market) => {
      const questionTokens = tokenize(`${market.question} ${market.eventTitle}`)
      const detailTokens = tokenize(`${market.description} ${market.eventCategory}`)
      const titleQuestion = overlapScore(titleTokens, questionTokens)
      const titleDetail = overlapScore(titleTokens, detailTokens)
      const contentQuestion = overlapScore(contentTokens, questionTokens)
      const score = titleQuestion * 3
        + titleDetail * 2
        + contentQuestion * 2
        + overlapScore(contentTokens, detailTokens)
      const anchored = titleQuestion >= 1 || titleDetail >= 2 || contentQuestion >= 3
      return { market, score, anchored }
    })
    .filter(({ score, anchored }) => anchored && score >= 6)
    .sort((a, b) => b.score - a.score || b.market.volume24hr - a.market.volume24hr)
    .slice(0, limit)
    .map(({ market }) => market)
}

export function findNewsForMarket(
  market: NormalizedMarket,
  posts: MatchableNewsPost[],
  limit = 3,
): MatchableNewsPost[] {
  return posts
    .map((post) => ({
      post,
      score: findMarketsForNews(post, [market], 1).length > 0
        ? overlapScore(tokenize(`${post.title} ${post.summary} ${post.body ?? ''}`), tokenize(`${market.question} ${market.eventTitle} ${market.description} ${market.eventCategory}`))
        : 0,
    }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score || (b.post.publishedAt?.getTime() ?? 0) - (a.post.publishedAt?.getTime() ?? 0))
    .slice(0, limit)
    .map(({ post }) => post)
}
