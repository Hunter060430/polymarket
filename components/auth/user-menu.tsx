'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { User, LogOut, Star, Zap } from 'lucide-react'

export function UserMenu() {
  const { data: session, isPending } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (isPending) {
    return <div className="size-9 flex items-center justify-center" aria-hidden="true" />
  }

  if (!session?.user) {
    return (
      <Link
        href="/sign-in"
        className="hidden md:inline-flex items-center text-xs tracking-[0.06em] uppercase text-muted-foreground hover:text-foreground transition-colors px-3 h-9"
      >
        Sign In
      </Link>
    )
  }

  const { user } = session
  const display = user.name || user.email?.split('@')[0] || 'Account'
  const initial = display.charAt(0).toUpperCase()

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center size-9 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image || "/placeholder.svg"} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-52 border border-border bg-background shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{display}</p>
            {user.email && !user.email.endsWith('.web3') && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
            )}
          </div>
          <Link
            href="/pre-season"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Zap className="size-3.5" aria-hidden="true" />
            Pre-Season
            <span className="ml-auto relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-primary" />
            </span>
          </Link>
          <Link
            href="/watchlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Star className="size-3.5" aria-hidden="true" />
            Watchlist
          </Link>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <User className="size-3.5" aria-hidden="true" />
            Account
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors border-t border-border"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
