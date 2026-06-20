'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RotateCcw, Sparkles } from 'lucide-react'

// ── Math captcha ──────────────────────────────────────────────────────────────
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { a, b, answer: a + b }
}

// ── Rate limit (localStorage) ─────────────────────────────────────────────────
const STORAGE_KEY = 'verdict_ask_usage'
const MAX_PER_CAPTCHA = 5

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

function getRemainingInSession(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return MAX_PER_CAPTCHA
    const s = JSON.parse(raw)
    if (s.date !== getTodayUTC()) return MAX_PER_CAPTCHA
    return Math.max(0, MAX_PER_CAPTCHA - (s.countInSession ?? 0))
  } catch {
    return MAX_PER_CAPTCHA
  }
}

function consumeOne(): number {
  const today = getTodayUTC()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const s = raw ? JSON.parse(raw) : { date: today, countInSession: 0 }
    const base = s.date === today ? s : { date: today, countInSession: 0 }
    const next = { ...base, countInSession: base.countInSession + 1 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return Math.max(0, MAX_PER_CAPTCHA - next.countInSession)
  } catch {
    return 0
  }
}

function resetSessionCount() {
  const today = getTodayUTC()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, countInSession: 0 }))
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Which markets have the lowest clarity scores right now?',
  'Show me the highest-risk Bitcoin markets',
  'What are the top 5 most ambiguous markets by score?',
  'Which markets have the highest volume but worst rules?',
  'Are there any Critical-risk markets ending this month?',
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AskPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [remaining, setRemaining] = useState(MAX_PER_CAPTCHA)

  // Captcha
  const [captcha, setCaptcha] = useState(generateCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaSolved, setCaptchaSolved] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const handleSubmit = useCallback(
    async (questionText?: string) => {
      const text = (questionText ?? input).trim()
      if (!text || isStreaming || remaining <= 0 || !captchaSolved || !captchaToken) return

      const newRemaining = consumeOne()
      setRemaining(newRemaining)

      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsStreaming(true)

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, captchaToken }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: err.message ?? 'Something went wrong. Please try again.' }
                : m,
            ),
          )
          setIsStreaming(false)
          return
        }

        // Read the SSE stream and extract text-delta chunks
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const chunk = JSON.parse(data)
              // AI SDK UIMessageStream emits type:"text-delta" with delta field
              if (chunk.type === 'text-delta' && typeof chunk.delta === 'string') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + chunk.delta } : m,
                  ),
                )
              }
            } catch {
              // ignore unparseable lines
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Network error. Please check your connection and try again.' }
              : m,
          ),
        )
      } finally {
        setIsStreaming(false)
        if (newRemaining <= 0) resetCaptcha()
      }
    },
    [input, isStreaming, remaining, captchaSolved, captchaToken],
  )

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
        {messages.length === 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] text-muted-foreground tracking-wide uppercase mb-3">Try asking</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSubmit(s)}
                className="block w-full text-left text-sm text-muted-foreground border border-border px-4 py-2.5 hover:bg-secondary/40 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] bg-secondary/60 border border-border px-4 py-2.5 text-sm text-foreground">
                    {msg.content}
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] tracking-[0.1em] uppercase text-primary mb-2">Verdict AI</p>
                    {msg.content ? (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    ) : isStreaming ? (
                      <div className="flex gap-1.5 py-1">
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Bottom input area */}
      <div className="shrink-0 border-t border-border pb-6 pt-3 space-y-3">

        {/* Captcha / status */}
        {!captchaSolved ? (
          <div className="flex items-center gap-3 flex-wrap">
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
              Verified — {remaining}/{MAX_PER_CAPTCHA} questions remaining in this session
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
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="flex gap-2"
          >
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
