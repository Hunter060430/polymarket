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
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity">
          <ShieldAlert className="size-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight leading-none">
            Rule Clarity Index
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
