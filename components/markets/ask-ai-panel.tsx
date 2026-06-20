'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

// ── Simple math captcha ──────────────────────────────────────────────────────
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { a, b, answer: a + b }
}

// ── Helper: extract text from UIMessage parts ────────────────────────────────
function getMessageText(parts: unknown[]): string {
  if (!Array.isArray(parts)) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => (p as { type: string }).type === 'text')
    .map((p) => p.text)
    .join('')
}

const STORAGE_KEY = 'verdict_ask_usage'
const MAX_DAILY = 5

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

function getRemainingLocal(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return MAX_DAILY
    const { date, count } = JSON.parse(raw)
    if (date !== getTodayUTC()) return MAX_DAILY
    return Math.max(0, MAX_DAILY - count)
  } catch {
    return MAX_DAILY
  }
}

function consumeLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const today = getTodayUTC()
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }))
      return MAX_DAILY - 1
    }
    const { date, count } = JSON.parse(raw)
    const newCount = date === today ? count + 1 : 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }))
    return Math.max(0, MAX_DAILY - newCount)
  } catch {
    return MAX_DAILY - 1
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AskAIPanel() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [remaining, setRemaining] = useState<number>(MAX_DAILY)

  // Captcha state
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
      prepareSendMessagesRequest: ({ id, messages: msgs }) => ({
        body: {
          question: msgs[msgs.length - 1]
            ? getMessageText((msgs[msgs.length - 1] as { parts?: unknown[] }).parts ?? []) || (msgs[msgs.length - 1] as { content?: string }).content
            : '',
          captchaToken,
          id,
        },
      }),
    }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    setRemaining(getRemainingLocal())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  function solveCaptcha() {
    if (parseInt(captchaInput) === captcha.answer) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming || remaining <= 0 || !captchaSolved) return

    const newRemaining = consumeLocal()
    setRemaining(newRemaining)

    sendMessage({ text: input.trim() })
    setInput('')
    // Reset captcha after each submission for next question
    resetCaptcha()
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground text-xs tracking-[0.08em] uppercase px-4 py-2.5 shadow-lg hover:opacity-90 transition-all"
        aria-label="Ask AI about markets"
      >
        <svg viewBox="0 0 20 20" className="size-3.5 fill-current shrink-0" aria-hidden="true">
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z" />
        </svg>
        Ask AI
        {remaining < MAX_DAILY && (
          <span className="ml-1 opacity-60">{remaining}/{MAX_DAILY}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[min(420px,calc(100vw-3rem))] flex flex-col border border-border bg-background shadow-2xl" style={{ maxHeight: 'min(520px, calc(100vh - 160px))' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-primary font-medium">Verdict AI</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                问 AI 哪些市场风险高、规则模糊 — {remaining}/{MAX_DAILY} 次剩余
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" className="size-4 fill-current">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">可以问例如：</p>
                {[
                  '哪些市场的清晰度评分最低？',
                  '有哪些关于比特币的高风险市场？',
                  '规则最模糊的 5 个市场是哪些？',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="block w-full text-left text-xs text-muted-foreground border border-border px-3 py-2 hover:bg-secondary/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg: { id: string; role: string; parts?: unknown[]; content?: string }) => {
              const text = getMessageText(msg.parts ?? []) || msg.content || ''
              return (
                <div
                  key={msg.id}
                  className={`text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-foreground font-medium border-l-2 border-primary pl-3'
                      : 'text-muted-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>
              )
            })}

            {isStreaming && (
              <div className="flex gap-1 py-1">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border shrink-0 px-4 py-3 space-y-3">
            {/* Captcha */}
            {!captchaSolved ? (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground tracking-wide uppercase">人机验证</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-foreground bg-secondary/60 px-3 py-1.5 border border-border select-none">
                    {captcha.a} + {captcha.b} = ?
                  </span>
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && solveCaptcha()}
                    placeholder="答案"
                    className={`w-20 text-sm bg-background border px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary ${captchaError ? 'border-destructive' : 'border-border'}`}
                  />
                  <button
                    onClick={solveCaptcha}
                    className="text-xs px-3 py-1.5 border border-border hover:bg-secondary/40 transition-colors"
                  >
                    确认
                  </button>
                </div>
                {captchaError && (
                  <p className="text-[10px] text-destructive">答案不对，请重试</p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-primary/70">验证通过</p>
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
                      handleSubmit(e)
                    }
                  }}
                  placeholder={captchaSolved ? '问任何关于市场的问题…' : '请先完成人机验证'}
                  disabled={!captchaSolved || isStreaming}
                  rows={2}
                  className="flex-1 resize-none bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground px-3 py-2 focus:outline-none focus:border-primary disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming || !captchaSolved}
                  className="px-3 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0"
                  aria-label="发送"
                >
                  <svg viewBox="0 0 20 20" className="size-4 fill-current">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-1">
                今日次数已用完，明天再来
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
