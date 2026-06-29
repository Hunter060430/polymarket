'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages, ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { label: 'English (Original)', code: null     },
  { label: '简体中文',            code: 'zh-CN'  },
  { label: '繁體中文',            code: 'zh-TW'  },
  { label: '日本語',             code: 'ja'     },
  { label: '한국어',             code: 'ko'     },
  { label: 'Español',           code: 'es'     },
  { label: 'Português',         code: 'pt'     },
  { label: 'Français',          code: 'fr'     },
  { label: 'Deutsch',           code: 'de'     },
  { label: 'Русский',           code: 'ru'     },
  { label: 'العربية',            code: 'ar'     },
  { label: 'Türkçe',            code: 'tr'     },
  { label: 'Tiếng Việt',        code: 'vi'     },
  { label: 'Bahasa Indonesia',  code: 'id'     },
  { label: 'ภาษาไทย',           code: 'th'     },
]

export function GoogleTranslate() {
  const [open, setOpen]       = useState(false)
  const [pageUrl, setPageUrl] = useState('')
  const containerRef          = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function getTranslateUrl(code: string) {
    // Google Translate proxy: https://translate.google.com/translate?sl=en&tl=XX&u=PAGE_URL
    return `https://translate.google.com/translate?sl=en&tl=${code}&u=${encodeURIComponent(pageUrl)}`
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Translate page"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center justify-center gap-1 h-9 px-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs"
      >
        <Languages className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline tracking-wide">Translate</span>
        <ChevronDown className={cn('size-3 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-1 z-50 bg-background border border-border shadow-lg py-1 min-w-[190px] max-h-72 overflow-y-auto"
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-3 pt-2 pb-1 font-medium select-none">
            Open in Google Translate
          </p>
          {LANGUAGES.map((lang) => (
            lang.code === null ? (
              // "English (Original)" — just close the dropdown
              <button
                key="en"
                role="option"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                {lang.label}
              </button>
            ) : (
              <a
                key={lang.code}
                href={getTranslateUrl(lang.code)}
                target="_blank"
                rel="noopener noreferrer"
                role="option"
                aria-selected={false}
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                {lang.label}
                <ExternalLink className="size-3 shrink-0 opacity-40" aria-hidden="true" />
              </a>
            )
          ))}
          <p className="text-[10px] text-muted-foreground px-3 pt-1 pb-2 leading-relaxed select-none border-t border-border mt-1">
            Powered by Google Translate
          </p>
        </div>
      )}
    </div>
  )
}
