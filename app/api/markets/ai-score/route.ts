// POST /api/markets/ai-score
// Semantic LLM analysis of a market's resolution criteria.
// Results are cached in ai_score_cache by market_id — the LLM is called at
// most once per market regardless of how many users request it.

import { db } from '@/lib/db'
import { aiScoreCache } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI service not configured.' }, { status: 500 })
  }

  const body = await req.json() as {
    marketId?: string
    question?: string
    description?: string
    resolutionSource?: string
    outcomes?: string[]
    deterministicScore?: number
    riskLevel?: string
    scoreBreakdown?: Record<string, number>
    scoreFlags?: string[]
  }

  const {
    marketId = '',
    question = '',
    description = '',
    resolutionSource = '',
    outcomes = [],
    deterministicScore,
    riskLevel,
    scoreBreakdown,
    scoreFlags,
  } = body

  if (!question.trim()) {
    return Response.json({ error: 'Market question is required.' }, { status: 400 })
  }

  // ── Cache check ──────────────────────────────────────────────────────────
  // If we already ran AI for this market, return the cached result immediately.
  if (marketId) {
    const cached = await db
      .select()
      .from(aiScoreCache)
      .where(eq(aiScoreCache.marketId, marketId))
      .limit(1)

    if (cached.length > 0) {
      return Response.json({ ...cached[0].result as object, cached: true })
    }
  }

  // ── LLM call ─────────────────────────────────────────────────────────────
  const outcomesText = outcomes.join(' / ')

  // Format the six-dimension breakdown so the LLM knows which dimensions are weak
  const breakdownText = scoreBreakdown
    ? Object.entries(scoreBreakdown)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : '  (not provided)'

  const flagsText = scoreFlags && scoreFlags.length > 0
    ? scoreFlags.map((f) => `  - ${f}`).join('\n')
    : '  (none)'

  const systemPrompt = `You are a prediction market resolution quality analyst. You specialize in identifying ambiguous, incomplete, or manipulable resolution criteria in prediction market contracts.

You will be given the COMPLETE resolution criteria for an ACTIVE, NOT YET SETTLED Polymarket prediction market. A deterministic rule-based system has already scored it ${deterministicScore ?? '?'}/100 (risk level: ${riskLevel ?? '?'}).

IMPORTANT CONTEXT: This market has NOT resolved yet. Do NOT flag the absence of a historical resolution or final outcome as a finding. Only analyse the written resolution criteria text for future resolution risk.

Your job is to provide a SEMANTIC analysis of the FULL description text — look for things the rule-based system might miss:
1. Logical contradictions in the criteria
2. Phrases that sound specific but are actually vague (e.g. "widely reported", "effectively controls", "consensus of credible sources")
3. Missing definitions for key terms used in the resolution criteria
4. Scenarios where the resolution criteria could be interpreted multiple ways at resolution time
5. Whether the stated resolution source actually has the authority/capacity to definitively resolve this market

Pay particular attention to dimensions that scored low in the rule-based breakdown (shown in the context below).

Do NOT report findings for:
- The market not having resolved yet (it is active by design)
- Missing final outcomes or settlement data
- Anything that is only a concern after resolution, not before

Respond with a JSON object in this exact format (no markdown, no extra text):
{
  "semanticScore": <integer 0-100, your confidence that this market will resolve without dispute>,
  "agreement": <"agrees" | "disagrees" | "neutral">,
  "agreementNote": <one sentence explaining if you agree/disagree with the deterministic score>,
  "findings": [
    { "severity": <"critical" | "high" | "medium" | "low">, "finding": <string, max 120 chars> }
  ],
  "verdict": <string, 2-3 sentences of overall assessment, max 300 chars>
}`

  const userMessage = `MARKET QUESTION: ${question}

OUTCOMES: ${outcomesText || 'YES / NO'}

RESOLUTION SOURCE: ${resolutionSource || '(not specified in criteria)'}

FULL RESOLUTION CRITERIA / DESCRIPTION:
${description || '(no description provided)'}

RULE-BASED SCORE BREAKDOWN (out of max per dimension):
${breakdownText}

FLAGS RAISED BY RULE-BASED SYSTEM:
${flagsText}`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: false,
      max_tokens: 900,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[ai-score] DeepSeek error:', res.status, errText)
    return Response.json({ error: 'AI service error.' }, { status: 502 })
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content ?? ''

  let parsed: Record<string, unknown>
  try {
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(clean) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'AI returned malformed response.', raw }, { status: 502 })
  }

  // ── Post-process: filter false-positive findings ─────────────────────────
  // Remove any "critical" findings that are purely about no resolution having
  // occurred yet — these are irrelevant for active markets.
  const UNRESOLVED_PATTERNS = [
    /no resolution source/i,
    /not yet resolved/i,
    /has not (been )?resolved/i,
    /no (final )?outcome/i,
    /market (is|has not) (closed|settled)/i,
    /resolution (has not|not) occurred/i,
  ]

  if (Array.isArray(parsed.findings)) {
    parsed.findings = (parsed.findings as { severity: string; finding: string }[]).filter(
      (f) => {
        if (f.severity !== 'critical' && f.severity !== 'high') return true
        return !UNRESOLVED_PATTERNS.some((re) => re.test(f.finding))
      },
    )
  }

  // ── Write to cache ────────────────────────────────────────────────────────
  if (marketId) {
    await db
      .insert(aiScoreCache)
      .values({ marketId, result: parsed })
      .onConflictDoNothing()
  }

  return Response.json(parsed)
}
