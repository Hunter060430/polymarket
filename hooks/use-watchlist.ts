'use client'

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useSession } from '@/lib/auth-client'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (response.status === 401) return { ids: [] as string[] }
  if (!response.ok) throw new Error('Unable to load watchlist')
  return response.json() as Promise<{ ids: string[] }>
}

export function useWatchlist() {
  const { data: session } = useSession()
  const { data, mutate, isLoading } = useSWR('/api/watchlist', fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  })
  const watchlist = useMemo(() => new Set(data?.ids ?? []), [data?.ids])

  const toggle = useCallback(async (marketId: string) => {
    if (!session?.user) {
      window.location.href = `/sign-in?next=${encodeURIComponent(window.location.pathname)}`
      return
    }
    const removing = watchlist.has(marketId)
    const nextIds = removing
      ? [...watchlist].filter((id) => id !== marketId)
      : [...watchlist, marketId]
    await mutate(
      async () => {
        const response = await fetch(removing ? `/api/watchlist?marketId=${encodeURIComponent(marketId)}` : '/api/watchlist', {
          method: removing ? 'DELETE' : 'POST',
          headers: removing ? undefined : { 'Content-Type': 'application/json' },
          body: removing ? undefined : JSON.stringify({ marketId }),
        })
        if (!response.ok) throw new Error('Unable to update watchlist')
        return { ids: nextIds }
      },
      { optimisticData: { ids: nextIds }, rollbackOnError: true, revalidate: false },
    )
  }, [mutate, session?.user, watchlist])

  const isStarred = useCallback((id: string) => watchlist.has(id), [watchlist])
  return { watchlist, toggle, isStarred, isLoading, isAuthenticated: Boolean(session?.user) }
}
