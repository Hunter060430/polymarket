'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'
import Script from 'next/script'

// Extend window for the Google Translate init callback
declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: new (
          opts: { pageLanguage: string; includedLanguages?: string; layout?: number; autoDisplay?: boolean },
          id: string,
        ) => void
      }
    }
  }
}

export function GoogleTranslate() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef    = useRef<HTMLDivElement>(null)
  const initialized  = useRef(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Init the widget once the Google Translate script is loaded
  function initWidget() {
    if (initialized.current) return
    if (!window.google?.translate?.TranslateElement) return
    initialized.current = true
    window.googleTranslateElementInit = () => {}
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        // Curated languages — covers the majority of Polymarket's global user base
        includedLanguages: 'en,zh-CN,zh-TW,ja,ko,es,pt,fr,de,ar,tr,ru,vi,th,id',
        autoDisplay: false,
      },
      'google-translate-widget',
    )
  }

  return (
    <>
      {/* Load Google Translate script — defer until after interaction for perf */}
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
        onLoad={initWidget}
      />

      <div ref={containerRef} className="relative">
        {/* Trigger button — matches the style of ThemeToggle / UserMenu */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Translate page"
          aria-expanded={open}
          className="inline-flex items-center justify-center size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Languages className="size-4" aria-hidden="true" />
        </button>

        {/* Dropdown shell */}
        {open && (
          <div
            ref={widgetRef}
            className="absolute right-0 top-full mt-1 z-50 bg-background border border-border shadow-lg p-3 min-w-[220px]"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">
              Translate page
            </p>
            {/* Google injects its language selector here */}
            <div id="google-translate-widget" />
          </div>
        )}
      </div>

      {/* Suppress Google's injected top banner and override widget styles */}
      <style>{`
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame { display: none !important; }
        body { top: 0 !important; }
        .goog-te-gadget { font-size: 0 !important; }
        .goog-te-gadget select {
          font-size: 0.75rem !important;
          padding: 4px 8px !important;
          border: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-radius: 0 !important;
          outline: none !important;
          width: 100% !important;
          cursor: pointer;
        }
        .goog-te-gadget .goog-te-gadget-simple { display: none !important; }
      `}</style>
    </>
  )
}
