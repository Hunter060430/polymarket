// POST /api/markets/ai-score
// Sends a market's resolution criteria to an LLM for semantic analysis,
// supplementing the deterministic rule-clarity score with natural-language
// reasoning about ambiguity, logical contradictions, and incomplete definitions.

export const runtime = 'edge'

const aiScoreRateLimitMap = new Map<string, { count: number; date: string }>()
const MAX_PER_DAY = 10

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const today = getTodayUTC()
  const entry = aiScoreRateLimitMap.get(ip)

  if (entry && entry.date === today && entry.count >= MAX_PER_DAY) {
    return Response.json({ error: 'Daily AI analysis limit reached. Try again tomorrow.' }, { status: 429 })
  }
  if (entry && entry.date === today) entry.count++
  else aiScoreRateLimitMap.set(ip, { count: 1, date: today })

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI service not configured.' }, { status: 500 })
  }

  const body = await req.json() as {
    question?: string
    description?: string
    resolutionSource?: string
    outcomes?: string[]
    deterministicScore?: number
    riskLevel?: string
  }

  const { question = '', description = '', resolutionSource = '', outcomes = [], deterministicScore, riskLevel } = body

  if (!question.trim()) {
    return Response.json({ error: 'Market question is required.' }, { status: 400 })
  }

  const outcomesText = outcomes.join(' / ')
  const systemPrompt = `You are a prediction market resolution quality analyst. You specialize in identifying ambiguous, incomplete, or manipulable resolution criteria in prediction market contracts.

You will be given the resolution criteria for a Polymarket prediction market. A deterministic rule-based system has already scored it ${deterministicScore ?? '?'}/100 (risk level: ${riskLevel ?? '?'}).

Your job is to provide a SEMANTIC analysis — look for things a rule-based system might miss:
1. Logical contradictions in the criteria
2. Phrases that sound specific but are actually ambiguous (e.g. "widely reported", "effectively controls")
3. Missing definitions for key terms
4. Scenarios where the resolution criteria could be interpreted multiple ways
5. Whether the stated resolution source actually has the authority/capacity to resolve this market

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

RESOLUTION SOURCE: ${resolutionSource || '(not specified)'}

RESOLUTION CRITERIA / DESCRIPTION:
${description || '(no description provided)'}`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: false,
      max_tokens: 600,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[ai-score] DeepSeek error:', errText)
    return Response.json({ error: 'AI service error.' }, { status: 502 })
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content ?? ''

  let parsed: unknown
  try {
    // Strip possible markdown code fences
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    return Response.json({ error: 'AI returned malformed response.', raw }, { status: 502 })
  }

  return Response.json(parsed)
}
