import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'

// In-memory rate limiter: ip → { count, date }
const rateLimitMap = new Map<string, { count: number; date: string }>()
const MAX_PER_DAY = 5

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

function sse(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const today = getTodayUTC()
  const entry = rateLimitMap.get(ip)

  if (entry && entry.date === today && entry.count >= MAX_PER_DAY) {
    return Response.json({ error: 'Daily limit of 5 questions reached.' }, { status: 429 })
  }
  if (entry && entry.date === today) {
    entry.count++
  } else {
    rateLimitMap.set(ip, { count: 1, date: today })
  }
  const remaining = MAX_PER_DAY - (rateLimitMap.get(ip)?.count ?? 1)

  const { question } = (await req.json()) as { question?: string }
  if (!question?.trim()) {
    return Response.json({ error: 'Question is required.' }, { status: 400 })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI service not configured.' }, { status: 500 })
  }

  // Fetch market data — errors are surfaced to the client via the stream
  let markets: Awaited<ReturnType<typeof fetchAllActivePolymarketMarkets>> = []
  let fetchError: string | null = null
  try {
    markets = await fetchAllActivePolymarketMarkets()
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ask] market fetch failed:', fetchError)
  }

  const marketCount = markets.length
  const marketContext = marketCount > 0
    ? markets
        .map(
          (m, i) =>
            `${i + 1}. [Score:${m.score?.totalScore ?? '?'}/Risk:${m.score?.riskLevel ?? '?'}] ${m.question} (Volume:$${Number(m.volume ?? 0).toLocaleString()}, Ends:${m.endDate ?? 'N/A'})`,
        )
        .join('\n')
    : '(no market data available)'

  const systemPrompt = `You are Verdict AI, the intelligent assistant for the Verdict platform (ver.watch).

ABOUT VERDICT:
Verdict is an independent watchdog for prediction market resolution quality, founded by Hunter Guo — a 20-year-old second-year student at King's College London. The project was born after Hunter personally experienced a highly controversial Polymarket settlement resolved against what he believed was the clear spirit of its own rules. Realizing that individual users have almost no effective tools when facing opaque platform decisions, he built Verdict to change that.

Verdict scores every active Polymarket market on the clarity of its written resolution rules before any money is at risk. The longer-term mission is a non-profit, public-interest archive where users can record, preserve, and publish cases of unfair or controversial resolutions. Verdict issues no token, sells no financial products, and has no commercial relationship with Polymarket. It uses only the public Gamma API.

PRINCIPLES:
- Deterministic: every score is produced by the same documented ruleset — no human judgment, no black boxes.
- Transparent: full methodology is published at ver.watch/methodology.
- Independent: no financial relationship with Polymarket or any prediction market platform.
- Conservative: when in doubt, flag it.

SCORING SYSTEM:
- 0–30: Critical risk (very ambiguous resolution rules)
- 30–50: High risk
- 50–70: Medium risk
- 70–100: Low risk (clear, unambiguous rules)
Higher score = clearer resolution rules = lower dispute risk.

ACTIVE MARKETS (${marketCount} total loaded in real-time):
${marketContext}

RULES:
- Always respond in English regardless of the user's language.
- Be concise and analytical.
- When asked about Verdict, Hunter Guo, or the project background, answer from the ABOUT section above.
- When listing markets, include score and risk level.
- Never make up market data — only reference markets from the list above.`

  // Call DeepSeek streaming directly
  const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question.trim() },
      ],
    }),
  })

  if (!dsRes.ok) {
    const errText = await dsRes.text()
    console.error('[ask] DeepSeek API error:', errText)
    return Response.json({ error: 'AI service error.' }, { status: 502 })
  }

  const encoder = new TextEncoder()
  const body = dsRes.body!

  const stream = new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      // First events: remaining quota + how many markets were loaded
      controller.enqueue(encoder.encode(sse({ type: 'remaining', remaining })))
      controller.enqueue(encoder.encode(sse({ type: 'context', marketCount, fetchError })))

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const payload = trimmed.slice(5).trim()
            if (payload === '[DONE]') {
              controller.enqueue(encoder.encode(sse({ type: 'done' })))
              continue
            }
            try {
              const chunk = JSON.parse(payload)
              const delta = chunk.choices?.[0]?.delta?.content
              if (delta) {
                controller.enqueue(encoder.encode(sse({ type: 'delta', text: delta })))
              }
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
