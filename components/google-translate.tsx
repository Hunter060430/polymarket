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
  const [open, setOpen]     = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)
  const initialized         = useRef(false)

  function initWidget() {
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

  useEffect(() => {
    // Register callback BEFORE script loads
    window.googleTranslateElementInit = initWidget
    // In case script already loaded before this component mounted
    initWidget()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onLoad={initWidget}
      />

      {/* Suppress Google's injected top banner + style the select */}
      <style>{`
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame { display: none !important; }
        .skiptranslate:not(#google-translate-widget):not(#google-translate-widget *) {
          display: none !important;
        }
        body { top: 0 !important; }
        .goog-te-gadget { font-size: 0 !important; }
        .goog-te-gadget > span { display: none !important; }
        .goog-te-gadget select {
          font-size: 0.8rem !important;
          padding: 6px 10px !important;
          border: 1px solid var(--border) !important;
          background: var(--background) !important;
          color: var(--foreground) !important;
          border-radius: 2px !important;
          outline: none !important;
          width: 100% !important;
          cursor: pointer !important;
          display: block !important;
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

        {/* Dropdown panel — always in DOM so Google's select is never destroyed */}
        <div
          role="dialog"
          aria-label="Language selector"
          className="absolute right-0 top-full mt-1 z-50 bg-background border border-border shadow-lg p-3 min-w-[200px]"
          style={{ display: open ? 'block' : 'none' }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">
            Translate page
          </p>
          {/* Google Translate mounts a <select> into this node exactly once */}
          <div id="google-translate-widget" />
        </div>
      </div>
    </>
  )
}
