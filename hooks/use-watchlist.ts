'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'verdict:watchlist'

function readStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeStorage(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {}
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())

  // Hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    setWatchlist(readStorage())
  }, [])

  const toggle = useCallback((id: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      writeStorage(next)
      return next
    })
  }, [])

  const isStarred = useCallback((id: string) => watchlist.has(id), [watchlist])

  return { watchlist, toggle, isStarred }
}
