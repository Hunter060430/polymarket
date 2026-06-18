import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const RISK_COLORS: Record<string, string> = {
  Critical: '#c0392b',
  High:     '#c97b2a',
  Medium:   '#b8922a',
  Low:      '#4a7c59',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const question  = searchParams.get('q')    ?? 'Verdict — Prediction Market Clarity Index'
  const score     = searchParams.get('score') ?? '—'
  const risk      = searchParams.get('risk')  ?? ''
  const accentColor = RISK_COLORS[risk] ?? '#c97b2a'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1c1813',
          padding: '72px 80px',
          fontFamily: 'Georgia, serif',
          justifyContent: 'space-between',
        }}
      >
        {/* Top: wordmark + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: '#c97b2a', fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            VERDICT
          </span>
          <span style={{ color: '#8a7e72', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Prediction Market Clarity Index
          </span>
        </div>

        {/* Middle: question */}
        <div
          style={{
            color: '#f0ece5',
            fontSize: question.length > 100 ? '28px' : '36px',
            lineHeight: '1.25',
            maxWidth: '900px',
            fontWeight: 300,
          }}
        >
          {question}
        </div>

        {/* Bottom: score + risk badge */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {score !== '—' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: accentColor, fontSize: '80px', fontWeight: 300, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ color: '#8a7e72', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Clarity Score / 100
              </span>
            </div>
          ) : (
            <div />
          )}

          {risk && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                border: `1px solid ${accentColor}`,
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentColor }} />
              <span style={{ color: accentColor, fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {risk} Risk
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
