'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Search, LayoutDashboard, List, CheckCircle2, BookOpen, Code2,
  Info, GitCompare, Sun, Moon, TrendingUp, ArrowUpRight,
} from 'lucide-react'

interface MarketHit {
  marketId: string
  question: string
  score: number
  riskLevel: string
}

const PAGES = [
  { label: 'Dashboard',     href: '/dashboard',        icon: LayoutDashboard },
  { label: 'All Markets',   href: '/markets',          icon: List },
  { label: 'Compare',       href: '/compare',          icon: GitCompare },
  { label: 'Resolved',      href: '/markets/resolved', icon: CheckCircle2 },
  { label: 'Methodology',   href: '/methodology',      icon: BookOpen },
  { label: 'API Reference', href: '/api-docs',         icon: Code2 },
  { label: 'Pricing',       href: '/pricing',          icon: TrendingUp },
  { label: 'About',         href: '/about',            icon: Info },
]

export function CommandMenu() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [markets, setMarkets] = useState<MarketHit[]>([])
  const [searching, setSearching] = useState(false)

  // ⌘K / Ctrl+K to toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Server-side search across the FULL market dataset, debounced. This finds
  // any market (not just the first page) and keeps payloads tiny.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setMarkets([])
      setSearching(false)
      return
    }
    setSearching(true)
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/markets?q=${encodeURIComponent(q)}&limit=8`)
        if (!res.ok) { if (!cancelled) setSearching(false); return }
        const data = await res.json()
        if (cancelled) return
        const hits: MarketHit[] = (data.markets ?? []).map((m: Record<string, unknown>) => ({
          marketId: m.marketId as string,
          question: m.question as string,
          score: (m.score as { totalScore: number })?.totalScore ?? 0,
          riskLevel: (m.score as { riskLevel: string })?.riskLevel ?? '',
        }))
        setMarkets(hits)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  // Reset state when the palette closes
  useEffect(() => {
    if (!open) { setQuery(''); setMarkets([]); setSearching(false) }
  }, [open])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const isDark = resolvedTheme === 'dark'
  const marketResults = markets

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="inline-flex items-center gap-2 h-9 px-2 sm:pl-2.5 sm:pr-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Search className="size-4" aria-hidden="true" />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] border border-border px-1.5 py-0.5 font-mono">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command Menu" description="Search markets and navigate">
        <CommandInput
          placeholder="Search markets or jump to a page..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {marketResults.length > 0 && (
            <>
              <CommandGroup heading="Markets">
                {marketResults.map((m) => (
                  <CommandItem
                    key={m.marketId}
                    value={`market-${m.marketId}-${m.question}`}
                    onSelect={() => go(`/markets/${m.marketId}`)}
                  >
                    <ArrowUpRight className="text-muted-foreground" />
                    <span className="truncate flex-1">{m.question}</span>
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0">{m.score}/100</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navigate">
            {PAGES.map((p) => (
              <CommandItem key={p.href} value={`page-${p.label}`} onSelect={() => go(p.href)}>
                <p.icon className="text-muted-foreground" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem
              value="toggle-theme"
              onSelect={() => { setTheme(isDark ? 'light' : 'dark'); setOpen(false) }}
            >
              {isDark ? <Sun className="text-muted-foreground" /> : <Moon className="text-muted-foreground" />}
              Switch to {isDark ? 'light' : 'dark'} theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
