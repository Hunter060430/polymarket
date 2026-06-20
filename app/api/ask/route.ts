import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { headers } from 'next/headers'

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com/v1',
})

// In-memory rate limiter: fingerprint → { count, date }
const rateLimitMap = new Map<string, { count: number; date: string }>()

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

const MAX_PER_CAPTCHA = 5

export async function POST(req: Request) {
  const headersList = await headers()

  // Device fingerprint
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  const ua = headersList.get('user-agent') ?? ''
  const fingerprint = `${ip}::${ua.slice(0, 60)}`
  const today = getTodayUTC()

  const existing = rateLimitMap.get(fingerprint)
  if (existing && existing.date === today && existing.count >= MAX_PER_CAPTCHA) {
    return new Response(
      JSON.stringify({ error: 'rate_limit', message: 'Daily limit reached.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (existing && existing.date === today) {
    existing.count++
  } else {
    rateLimitMap.set(fingerprint, { count: 1, date: today })
  }

  const remaining = MAX_PER_CAPTCHA - (rateLimitMap.get(fingerprint)?.count ?? 1)

  const body = await req.json()
  const { question, captchaToken } = body as { question?: string; captchaToken?: string }

  if (!captchaToken) {
    return new Response(
      JSON.stringify({ error: 'captcha', message: 'Please complete the verification first.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!question?.trim()) {
    return new Response(
      JSON.stringify({ error: 'empty', message: 'Please enter a question.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Fetch active markets
  let markets: Awaited<ReturnType<typeof fetchAllActivePolymarketMarkets>> = []
  try {
    markets = await fetchAllActivePolymarketMarkets()
  } catch {
    markets = []
  }

  const marketContext = markets
    .slice(0, 300)
    .map(
      (m, i) =>
        `${i + 1}. [Score:${m.score?.totalScore ?? '?'}/Risk:${m.score?.riskLevel ?? '?'}] ${m.question} (Ends: ${m.endDate ?? 'unknown'}, Volume: $${Number(m.volume ?? 0).toLocaleString()})`,
    )
    .join('\n')

  const systemPrompt = `You are Verdict AI, an expert analyst of Polymarket prediction markets. You have real-time access to ${markets.length} active markets and their clarity/risk scores from the Verdict scoring system.

Scoring system:
- Score 0–30: Critical risk (very ambiguous resolution rules)
- Score 30–50: High risk
- Score 50–70: Medium risk  
- Score 70–100: Low risk (clear, unambiguous rules)

Active markets data:
${marketContext}

Instructions:
- Always respond in English regardless of the user's language.
- Be concise and analytical.
- When listing markets, include their score and risk level.
- Format responses with clear structure when listing multiple markets.`

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: systemPrompt,
    messages: [{ role: 'user', content: question.trim() }],
    maxOutputTokens: 1200,
  })

  return result.toUIMessageStreamResponse({
    headers: { 'X-Remaining': String(remaining) },
  })
}
