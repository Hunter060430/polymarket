import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// Polymarket referral slug. Set NEXT_PUBLIC_POLYMARKET_REF to your affiliate
// handle to earn referral fees on trades originating from Verdict. Falls back
// to "verdict" so links still work before the env var is configured.
const POLYMARKET_REF = process.env.NEXT_PUBLIC_POLYMARKET_REF || 'verdict'

// Builds a Polymarket market URL with the Verdict referral param attached.
export function polymarketUrl(slug: string): string {
  if (!slug) return 'https://polymarket.com'
  return `https://polymarket.com/market/${slug}?via=${encodeURIComponent(POLYMARKET_REF)}`
}

// Formats a signed price change (fraction, e.g. 0.052) as a percentage-point
// string like "+5.2pp" / "-3.1pp". Returns null when there is no movement data.
export function formatPriceChange(change: number): string | null {
  if (!change || Math.abs(change) < 0.0001) return null
  const pp = change * 100
  const sign = pp > 0 ? '+' : ''
  return `${sign}${pp.toFixed(1)}pp`
}

export function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return null
  }
}
