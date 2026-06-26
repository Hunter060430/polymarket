'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: new (
          opts: { pageLanguage: string; includedLanguages?: string; autoDisplay?: boolean },
          id: string,
        ) => void
      }
    }
  }
}

export function GoogleTranslate() {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)
  const initialized     = useRef(false)

  // Register the callback Google's script will call once it loads.
  // Must be on window BEFORE the script executes.
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (initialized.current) return
      if (!window.google?.translate?.TranslateElement) return
      initialized.current = true
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,zh-CN,zh-TW,ja,ko,es,pt,fr,de,ar,tr,ru,vi,th,id',
          autoDisplay: false,
        },
        'google-translate-widget',
      )
    }
  }, [])

  // When dropdown opens, attempt init in case the script already loaded
  // before the callback was registered.
  useEffect(() => {
    if (!open) return
    const tryInit = () => {
      if (!initialized.current && window.google?.translate?.TranslateElement) {
        window.googleTranslateElementInit?.()
      }
    }
    // Small delay to let the DOM node render first
    const t = setTimeout(tryInit, 50)
    return () => clearTimeout(t)
  }, [open])

  // Close when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <>
      {/* Load immediately so the callback fires reliably */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />

      {/* Suppress Google's injected top banner */}
      <style>{`
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .goog-te-gadget { font-size: 0 !important; color: transparent !important; }
        .goog-te-gadget select {
          font-size: 0.8rem !important;
          padding: 6px 8px !important;
          border: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-radius: 2px !important;
          outline: none !important;
          width: 100% !important;
          cursor: pointer;
        }
      `}</style>

      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Translate page"
          aria-expanded={open}
          className="inline-flex items-center justify-center size-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Languages className="size-4" aria-hidden="true" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border shadow-lg p-3 min-w-[200px]">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">
              Translate page
            </p>
            {/* Google Translate injects a <select> here */}
            <div id="google-translate-widget" />
          </div>
        )}
      </div>
    </>
  )
}
