import { NextRequest, NextResponse } from 'next/server'

interface DisputePayload {
  platform: string
  marketUrl: string
  marketTitle: string
  position?: string
  estimatedLoss?: string
  whatHappened: string
  evidenceLinks?: string
  contact?: string
  consentPublish: boolean
}

function isValidUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}

export async function POST(req: NextRequest) {
  let body: DisputePayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // --- Validation ---
  if (!body.platform || typeof body.platform !== 'string') {
    return NextResponse.json({ error: 'platform is required.' }, { status: 422 })
  }
  if (!body.marketUrl || !isValidUrl(body.marketUrl)) {
    return NextResponse.json({ error: 'A valid marketUrl is required.' }, { status: 422 })
  }
  if (!body.marketTitle || body.marketTitle.trim().length < 3) {
    return NextResponse.json({ error: 'marketTitle is required.' }, { status: 422 })
  }
  if (!body.whatHappened || body.whatHappened.trim().length < 20) {
    return NextResponse.json({ error: 'whatHappened must be at least 20 characters.' }, { status: 422 })
  }

  // --- Build structured record ---
  const record = {
    id:             crypto.randomUUID(),
    submittedAt:    new Date().toISOString(),
    platform:       body.platform.trim(),
    marketUrl:      body.marketUrl.trim(),
    marketTitle:    body.marketTitle.trim(),
    position:       body.position?.trim() ?? null,
    estimatedLoss:  body.estimatedLoss?.trim() ?? null,
    whatHappened:   body.whatHappened.trim(),
    evidenceLinks:  body.evidenceLinks?.trim().split('\n').map(s => s.trim()).filter(Boolean) ?? [],
    contact:        body.contact?.trim() ?? null,
    consentPublish: Boolean(body.consentPublish),
    userAgent:      req.headers.get('user-agent') ?? null,
    ip:             req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
  }

  // Log to server console — in production this surfaces in Vercel Function Logs,
  // giving a real audit trail without requiring a database connection.
  console.log('[verdict:dispute]', JSON.stringify(record))

  return NextResponse.json({ success: true, id: record.id }, { status: 201 })
}
