'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldAlert, BarChart2, List, BookOpen, MessageSquareWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/markets', label: 'Markets', icon: List },
  { href: '/methodology', label: 'Methodology', icon: BookOpen },
  { href: '/submit-dispute', label: 'Submit Dispute', icon: MessageSquareWarning },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground hover:opacity-70 transition-opacity"
        >
          <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
          <span className="font-heading text-base font-medium tracking-wide">
            Rule Clarity Index
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide transition-colors',
                  active
                    ? 'text-foreground border-b border-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

export function PageFooter() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-5xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Data from the public Polymarket Gamma API. Scores are heuristic estimates — not legal or financial advice.
        </p>
        <p className="text-xs text-muted-foreground">
          Independent. Unaffiliated with Polymarket.
        </p>
      </div>
    </footer>
  )
}
