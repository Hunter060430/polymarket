'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/markets',   label: 'Markets'   },
  { href: '/methodology', label: 'Methodology' },
  { href: '/submit-dispute', label: 'Submit Dispute' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-heading text-[15px] font-light tracking-[0.08em] uppercase text-foreground hover:text-primary transition-colors"
        >
          Rule Clarity Index
        </Link>

        {/* Nav links */}
        <nav className="flex items-center" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              href === '/dashboard'
                ? pathname === href
                : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative px-4 h-14 inline-flex items-center text-xs tracking-[0.06em] uppercase transition-colors',
                  active
                    ? 'text-foreground after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
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
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-heading text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            Rule Clarity Index
          </Link>
          <Link href="/methodology" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Methodology</Link>
          <Link href="/submit-dispute" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Submit Dispute</Link>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm text-right">
          Data from Polymarket Gamma API. Scores are heuristic estimates — not legal or financial advice. Independent, unaffiliated.
        </p>
      </div>
    </footer>
  )
}
