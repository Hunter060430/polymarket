'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Language list — label shown in the dropdown, value is the Google Translate
// language code written into the googtrans cookie.
const LANGUAGES = [
  { label: 'English',             value: 'en'    },
  { label: '简体中文',              value: 'zh-CN' },
  { label: '繁體中文',              value: 'zh-TW' },
  { label: '日本語',               value: 'ja'    },
  { label: '한국어',               value: 'ko'    },
  { label: 'Español',             value: 'es'    },
  { label: 'Português',           value: 'pt'    },
  { label: 'Français',            value: 'fr'    },
  { label: 'Deutsch',             value: 'de'    },
  { label: 'العربية',              value: 'ar'    },
  { label: 'Türkçe',              value: 'tr'    },
  { label: 'Русский',             value: 'ru'    },
  { label: 'Tiếng Việt',          value: 'vi'    },
  { label: 'ภาษาไทย',             value: 'th'    },
  { label: 'Bahasa Indonesia',    value: 'id'    },
]

function setGoogleTranslateCookie(lang: string) {
  // Google Translate reads the /en/<lang> value from the googtrans cookie.
  // Setting it on / makes it apply site-wide; expires in 1 year.
  const value  = lang === 'en' ? '' : `/en/${lang}`
  const domain = window.location.hostname
  const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
  // Set on current domain
  document.cookie = `googtrans=${value}; expires=${expiry}; path=/`
  // Also set on .domain (Google requires both forms)
  document.cookie = `googtrans=${value}; expires=${expiry}; path=/; domain=${domain}`
  document.cookie = `googtrans=${value}; expires=${expiry}; path=/; domain=.${domain}`
  // Reload triggers Google Translate to pick up the new cookie
  window.location.reload()
}

function getCurrentLang(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/)
    return match ? match[1] : 'en'
  } catch {
    return 'en'
  }
}

export function GoogleTranslate() {
  const [open, setOpen]       = useState(false)
  const [current, setCurrent] = useState('en')
  const containerRef          = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrent(getCurrentLang())
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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const currentLabel = LANGUAGES.find((l) => l.value === current)?.label ?? 'EN'

  function handleSelect(value: string) {
    setOpen(false)
    if (value !== current) {
      setGoogleTranslateCookie(value)
    }
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
        <span className="hidden sm:inline tracking-wide">{current === 'en' ? 'EN' : currentLabel.slice(0, 6)}</span>
        <ChevronDown className={cn('size-3 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-1 z-50 bg-background border border-border shadow-lg py-1 min-w-[180px] max-h-72 overflow-y-auto"
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-3 pt-2 pb-1 font-medium select-none">
            Page language
          </p>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              role="option"
              aria-selected={lang.value === current}
              onClick={() => handleSelect(lang.value)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-secondary/50',
                lang.value === current ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {lang.label}
              {lang.value === current && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
