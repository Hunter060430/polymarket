'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseKeyboardShortcutsOptions {
  marketIds: string[]
  activeIndex: number
  onChangeIndex: (i: number) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  onClearFilters: () => void
}

/**
 * Bloomberg-style keyboard shortcuts for the markets list.
 *
 * J / ArrowDown  — move focus down one row
 * K / ArrowUp    — move focus up one row
 * Enter          — open the focused market detail page
 * /              — focus search input
 * Escape         — clear all filters
 */
export function useKeyboardShortcuts({
  marketIds,
  activeIndex,
  onChangeIndex,
  searchInputRef,
  onClearFilters,
}: UseKeyboardShortcutsOptions) {
  const router = useRouter()

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept when user is typing in any input/textarea/select
      const tag = (e.target as HTMLElement).tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        (e.target as HTMLElement).isContentEditable

      if (e.key === '/') {
        // Always intercept '/' to focus search even when not typing
        if (isTyping) return
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      if (e.key === 'Escape' && isTyping) {
        // Blur search and clear filters
        searchInputRef.current?.blur()
        onClearFilters()
        return
      }

      if (isTyping) return

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault()
          onChangeIndex(Math.min(activeIndex + 1, marketIds.length - 1))
          break
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault()
          onChangeIndex(Math.max(activeIndex - 1, 0))
          break
        }
        case 'Enter': {
          e.preventDefault()
          const id = marketIds[activeIndex]
          if (id) router.push(`/markets/${id}`)
          break
        }
        case 'Escape': {
          e.preventDefault()
          onClearFilters()
          break
        }
      }
    },
    [activeIndex, marketIds, onChangeIndex, onClearFilters, router, searchInputRef]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])
}
