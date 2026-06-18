'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard',        label: 'Dashboard'      },
  { href: '/markets',          label: 'Markets'        },
  { href: '/markets/resolved', label: 'Resolved'       },
  { href: '/methodology',      label: 'Methodology'    },
  { href: '/about',            label: 'About'          },
  { href: '/submit-dispute',   label: 'Submit Dispute' },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-14">

        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 group shrink-0"
          aria-label="Verdict — Home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/verdict-logo.png"
            alt="Verdict logo"
            width={30}
            height={30}
            className="shrink-0 opacity-90 group-hover:opacity-100 transition-opacity"
            priority
          />
          <span className="font-heading text-[15px] font-light tracking-[0.1em] uppercase text-foreground group-hover:text-primary transition-colors">
            Verdict
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative px-3 h-14 inline-flex items-center text-xs tracking-[0.06em] uppercase transition-colors',
                  active
                    ? 'text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1.5px] after:bg-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  href === '/methodology'    && 'hidden lg:inline-flex',
                  href === '/submit-dispute' && 'hidden lg:inline-flex',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center size-9 text-foreground hover:text-primary transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t border-border bg-background"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center px-6 py-4 text-sm tracking-[0.06em] uppercase border-b border-border transition-colors',
                  active
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30',
                )}
              >
                {active && <span className="w-1 h-1 rounded-full bg-primary mr-3 shrink-0" aria-hidden="true" />}
                {label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}

export function PageFooter() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="border-t border-border mt-auto bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* Main footer grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10 border-b border-border">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Verdict">
              <Image
                src="/verdict-logo.png"
                alt="Verdict logo"
                width={26}
                height={26}
                className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span className="font-heading text-sm tracking-[0.1em] uppercase text-foreground">
                Verdict
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Independent scoring of prediction market resolution quality. Know before you trade.
            </p>
            <p className="text-xs text-muted-foreground">
              Data sourced from the Polymarket Gamma API. Not affiliated with Polymarket.
            </p>
          </div>

          {/* Product column */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-[0.12em] uppercase text-foreground font-medium">Product</p>
            <nav className="flex flex-col gap-2.5" aria-label="Product navigation">
              <Link href="/dashboard"          className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link href="/markets"            className="text-xs text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
              <Link href="/markets/resolved"   className="text-xs text-muted-foreground hover:text-foreground transition-colors">Resolved</Link>
              <Link href="/markets?sort=score-asc&risk=Critical" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Critical Risk</Link>
              <Link href="/submit-dispute"     className="text-xs text-muted-foreground hover:text-foreground transition-colors">Submit Dispute</Link>
            </nav>
          </div>

          {/* Resources column */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-[0.12em] uppercase text-foreground font-medium">Resources</p>
            <nav className="flex flex-col gap-2.5" aria-label="Resources navigation">
              <Link href="/methodology" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Methodology</Link>
              <Link href="/about"       className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <a
                href="https://gamma-api.polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Polymarket API ↗
              </a>
            </nav>
          </div>

          {/* Legal column */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-[0.12em] uppercase text-foreground font-medium">Legal</p>
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Scores are heuristic estimates. Not financial advice.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anonymized dispute cases may be published in the public interest.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-5">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Verdict. Independent and unaffiliated.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with public data for the public interest.
          </p>
        </div>

      </div>
    </footer>
  )
}
