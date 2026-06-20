import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { fetchAllActivePolymarketMarkets } from '@/lib/polymarket'
import { headers } from 'next/headers'

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com/v1',
})

// Simple in-memory rate limiter: device fingerprint → { count, date }
const rateLimitMap = new Map<string, { count: number; date: string }>()

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

const MAX_DAILY = 5

export async function POST(req: Request) {
  const headersList = await headers()

  // Device fingerprint: IP + User-Agent
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  const ua = headersList.get('user-agent') ?? ''
  const fingerprint = `${ip}::${ua.slice(0, 60)}`
  const today = getTodayUTC()

  // Rate limit check
  const existing = rateLimitMap.get(fingerprint)
  if (existing && existing.date === today) {
    if (existing.count >= MAX_DAILY) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit',
          message: `每台设备每天最多可以提问 ${MAX_DAILY} 次，明天再来吧。`,
          remaining: 0,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }
    existing.count++
  } else {
    rateLimitMap.set(fingerprint, { count: 1, date: today })
  }

  const remaining =
    MAX_DAILY - (rateLimitMap.get(fingerprint)?.count ?? 1)

  const { question, captchaToken } = await req.json()

  // Validate captcha token is present (client sends after user solves it)
  if (!captchaToken) {
    return new Response(
      JSON.stringify({ error: 'captcha', message: '请先完成人机验证。' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!question?.trim()) {
    return new Response(
      JSON.stringify({ error: 'empty', message: '请输入你的问题。' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Fetch all active markets and build context for the LLM
  let markets: Awaited<ReturnType<typeof fetchAllActivePolymarketMarkets>> = []
  try {
    markets = await fetchAllActivePolymarketMarkets()
  } catch {
    markets = []
  }

  // Build a compact market summary for the prompt (keep tokens manageable)
  const marketContext = markets
    .slice(0, 300)
    .map(
      (m, i) =>
        `${i + 1}. [Score:${m.score?.totalScore ?? '?'}/Risk:${m.score?.riskLevel ?? '?'}] ${m.question} (End: ${m.endDate ?? 'unknown'}, Volume: $${Number(m.volume ?? 0).toLocaleString()})`,
    )
    .join('\n')

  const systemPrompt = `You are Verdict AI, an expert analyst of Polymarket prediction markets. You have access to ${markets.length} currently active markets and their clarity/risk scores from the Verdict scoring system.

Key context:
- Clarity score 0-40 = Critical risk (ambiguous resolution rules)
- Clarity score 41-60 = High risk
- Clarity score 61-75 = Medium risk
- Clarity score 76-100 = Low risk (clear rules)

Current active markets:
${marketContext}

Answer the user's question concisely and helpfully in the same language they use. When citing markets, include their score and risk level. Format your response clearly with relevant market examples.`

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
    maxOutputTokens: 1000,
  })

  return result.toUIMessageStreamResponse({
    headers: {
      'X-Remaining-Questions': String(remaining),
    },
  })
}
