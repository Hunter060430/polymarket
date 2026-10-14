'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, FileText, MessageSquare, Users } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/news', label: 'News', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
]

export function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ver.watch
          </Link>
          <span className="text-border">/</span>
          <span className="text-xs text-muted-foreground">Admin</span>
          <nav className="flex items-center gap-1" aria-label="Admin navigation">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{adminName}</span>
          <Link
            href="/markets"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View site
            <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}
