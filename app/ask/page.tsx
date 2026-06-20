'use client'

import { useState, useRef, useEffect } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { Send, RotateCcw, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

// ── Math captcha ──────────────────────────────────────────────────────────────
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { a, b, answer: a + b }
}

// ── Helper: extract text from UIMessage parts ─────────────────────────────────
function getMessageText(parts: unknown[]): string {
  if (!Array.isArray(parts)) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => (p as { type: string }).type === 'text')
    .map((p) => p.text)
    .join('')
}

// ── Rate limit (localStorage) ─────────────────────────────────────────────────
const STORAGE_KEY = 'verdict_ask_usage'
const MAX_PER_CAPTCHA = 5

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

function getUsageState(): { date: string; captchaSessions: number; countInSession: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: getTodayUTC(), captchaSessions: 0, countInSession: 0 }
    return JSON.parse(raw)
  } catch {
    return { date: getTodayUTC(), captchaSessions: 0, countInSession: 0 }
  }
}

function getRemainingInSession(): number {
  const s = getUsageState()
  if (s.date !== getTodayUTC()) return MAX_PER_CAPTCHA
  return Math.max(0, MAX_PER_CAPTCHA - s.countInSession)
}

function consumeOne(): number {
  const today = getTodayUTC()
  const s = getUsageState()
  const base = s.date === today ? s : { date: today, captchaSessions: 0, countInSession: 0 }
  const next = { ...base, countInSession: base.countInSession + 1 }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return Math.max(0, MAX_PER_CAPTCHA - next.countInSession)
}

function resetSessionCount() {
  const today = getTodayUTC()
  const s = getUsageState()
  const next = { date: today, captchaSessions: (s.date === today ? s.captchaSessions : 0) + 1, countInSession: 0 }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Which markets have the lowest clarity scores right now?',
  'Show me the highest-risk Bitcoin markets',
  'What are the top 5 most ambiguous markets by score?',
  'Which markets have the highest volume but worst rules?',
  'Are there any Critical-risk markets ending this month?',
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AskPage() {
  const [input, setInput] = useState('')
  const [remaining, setRemaining] = useState(MAX_PER_CAPTCHA)

  // Captcha
  const [captcha, setCaptcha] = useState(generateCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaSolved, setCaptchaSolved] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ask',
      prepareSendMessagesRequest: ({ id, messages: msgs }) => {
        const last = msgs[msgs.length - 1]
        const text = last
          ? getMessageText((last as { parts?: unknown[] }).parts ?? []) ||
            (last as { content?: string }).content ||
            ''
          : ''
        return {
          body: { question: text, captchaToken, id },
        }
      },
    }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    setRemaining(getRemainingInSession())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  useEffect(() => {
    if (captchaSolved) inputRef.current?.focus()
  }, [captchaSolved])

  function solveCaptcha() {
    if (parseInt(captchaInput) === captcha.answer) {
      resetSessionCount()
      setRemaining(MAX_PER_CAPTCHA)
      setCaptchaSolved(true)
      setCaptchaToken(`math-ok-${Date.now()}`)
      setCaptchaError(false)
    } else {
      setCaptchaError(true)
      setCaptchaInput('')
      setCaptcha(generateCaptcha())
    }
  }

  function resetCaptcha() {
    setCaptchaSolved(false)
    setCaptchaToken(null)
    setCaptchaInput('')
    setCaptchaError(false)
    setCaptcha(generateCaptcha())
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || isStreaming || remaining <= 0 || !captchaSolved) return

    const newRemaining = consumeOne()
    setRemaining(newRemaining)

    sendMessage({ text: input.trim() })
    setInput('')

    // When session exhausted, require new captcha
    if (newRemaining <= 0) {
      resetCaptcha()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)] max-w-3xl mx-auto px-4 sm:px-6">

      {/* Header */}
      <div className="pt-8 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="size-4 text-primary shrink-0" />
          <p className="text-xs tracking-[0.14em] uppercase text-primary">Verdict AI</p>
        </div>
        <h1 className="font-heading text-2xl font-light tracking-tight text-foreground">
          Ask about Polymarket
        </h1>
        <p className="text-sm text-muted-foreground mt-1 text-pretty">
          Query all active markets by clarity score, risk level, topic, or volume. Powered by DeepSeek.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {!hasMessages ? (
          /* Empty state — suggestions */
          <div className="space-y-2 pt-2">
            <p className="text-[11px] text-muted-foreground tracking-wide uppercase mb-3">Try asking</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus() }}
                className="block w-full text-left text-sm text-muted-foreground border border-border px-4 py-2.5 hover:bg-secondary/40 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg: { id: string; role: string; parts?: unknown[]; content?: string }) => {
              const text = getMessageText(msg.parts ?? []) || msg.content || ''
              if (!text) return null
              return (
                <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] bg-secondary/60 border border-border px-4 py-2.5 text-sm text-foreground">
                      {text}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      <p className="text-[10px] tracking-[0.1em] uppercase text-primary mb-2">Verdict AI</p>
                      {text}
                    </div>
                  )}
                </div>
              )
            })}

            {isStreaming && (
              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-primary mb-2">Verdict AI</p>
                <div className="flex gap-1.5 py-1">
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Bottom input area */}
      <div className="shrink-0 border-t border-border pb-4 pt-3 space-y-3">

        {/* Captcha */}
        {!captchaSolved ? (
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-wide uppercase text-muted-foreground shrink-0">Verify</span>
            <span className="font-mono text-sm text-foreground bg-secondary/50 border border-border px-3 py-1.5 select-none shrink-0">
              {captcha.a} + {captcha.b} = ?
            </span>
            <input
              type="number"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && solveCaptcha()}
              placeholder="Answer"
              className={`w-20 text-sm bg-background border px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors ${captchaError ? 'border-destructive' : 'border-border'}`}
            />
            <button
              onClick={solveCaptcha}
              className="text-xs px-3 py-1.5 border border-border hover:bg-secondary/40 transition-colors shrink-0"
            >
              Confirm
            </button>
            {captchaError && (
              <p className="text-[10px] text-destructive">Wrong answer, try again</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-primary/70 tracking-wide">
              Verified — {remaining}/{MAX_PER_CAPTCHA} questions remaining
            </p>
            {remaining <= 0 && (
              <button
                onClick={resetCaptcha}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="size-3" />
                Verify again for more
              </button>
            )}
          </div>
        )}

        {/* Text input */}
        {remaining > 0 ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={captchaSolved ? 'Ask about any markets…' : 'Complete verification to start asking'}
              disabled={!captchaSolved || isStreaming}
              rows={2}
              className="flex-1 resize-none bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 focus:outline-none focus:border-primary disabled:opacity-40 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming || !captchaSolved}
              className="px-4 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0"
              aria-label="Send"
            >
              <Send className="size-4" />
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Complete the verification above to ask more questions.
          </p>
        )}
      </div>
    </main>
  )
}
