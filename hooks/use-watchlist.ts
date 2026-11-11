'use client'

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

interface WatchlistData {
  ids: string[]
  authenticated: boolean
}

const fetcher = async (url: string): Promise<WatchlistData> => {
  const response = await fetch(url)
  if (response.status === 401) return { ids: [], authenticated: false }
  if (!response.ok) throw new Error('Unable to load watchlist')
  const body = (await response.json()) as { ids: string[] }
  return { ids: body.ids, authenticated: true }
}

function redirectToSignIn() {
  window.location.href = `/sign-in?next=${encodeURIComponent(window.location.pathname)}`
}

// Auth state is derived from the watchlist response itself, so rows that render
// a star button no longer each subscribe to the session store.
export function useWatchlist() {
  const { data, mutate, isLoading } = useSWR('/api/watchlist', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    keepPreviousData: true,
  })
  const watchlist = useMemo(() => new Set(data?.ids ?? []), [data?.ids])

  const toggle = useCallback(async (marketId: string) => {
    if (data && !data.authenticated) {
      redirectToSignIn()
      return
    }
    const removing = watchlist.has(marketId)
    const nextIds = removing
      ? [...watchlist].filter((id) => id !== marketId)
      : [...watchlist, marketId]
    try {
      await mutate(
        async () => {
          const response = await fetch(removing ? `/api/watchlist?marketId=${encodeURIComponent(marketId)}` : '/api/watchlist', {
            method: removing ? 'DELETE' : 'POST',
            headers: removing ? undefined : { 'Content-Type': 'application/json' },
            body: removing ? undefined : JSON.stringify({ marketId }),
          })
          if (response.status === 401) {
            redirectToSignIn()
            throw new Error('Not signed in')
          }
          if (!response.ok) throw new Error('Unable to update watchlist')
          return { ids: nextIds, authenticated: true }
        },
        { optimisticData: { ids: nextIds, authenticated: true }, rollbackOnError: true, revalidate: false },
      )
    } catch {
      // rolled back by SWR; nothing else to do
    }
  }, [data, mutate, watchlist])

  const isStarred = useCallback((id: string) => watchlist.has(id), [watchlist])
  return { watchlist, toggle, isStarred, isLoading, isAuthenticated: Boolean(data?.authenticated) }
}
