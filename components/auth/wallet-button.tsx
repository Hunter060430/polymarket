'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useConnect, useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { authClient } from '@/lib/auth-client'
import { Loader2, Wallet, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Per-wallet icon SVGs
function WalletIcon({ name, iconUrl }: { name: string; iconUrl?: string }) {
  if (iconUrl) {
    return <img src={iconUrl} alt={name} className="size-5 shrink-0 rounded" />
  }
  const lower = name.toLowerCase()
  if (lower.includes('metamask')) {
    return (
      <svg viewBox="0 0 35 33" className="size-5 shrink-0" aria-hidden="true">
        <polygon fill="#E17726" stroke="#E17726" strokeWidth=".25" points="32.958.5 19.48 10.47 21.992 4.47"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points="2.042.5 15.4 10.56 13.008 4.47"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points="28.185 23.518 24.624 28.97 32.222 31.078 34.418 23.64"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points=".582 23.64 2.778 31.078 10.376 28.97 6.815 23.518"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points="9.976 14.82 7.838 18.018 15.37 18.35 15.13 10.22"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points="25.024 14.82 19.75 10.13 19.63 18.35 27.162 18.018"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points="10.376 28.97 14.93 26.738 10.978 23.694"/>
        <polygon fill="#E27625" stroke="#E27625" strokeWidth=".25" points="20.07 26.738 24.624 28.97 24.022 23.694"/>
      </svg>
    )
  }
  if (lower.includes('coinbase')) {
    return (
      <svg viewBox="0 0 32 32" className="size-5 shrink-0" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#0052FF" />
        <path fill="#fff" d="M16 7a9 9 0 1 0 0 18A9 9 0 0 0 16 7Zm0 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
        <rect fill="#fff" x="13" y="14.25" width="6" height="3.5" rx="1" />
      </svg>
    )
  }
  if (lower.includes('brave')) {
    return (
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="#FB542B" aria-hidden="true">
        <path d="M19.78 8.76l.22-1.04-.9-.8.68-1-.84-.68-.8.94-1.1-.3L16.7 5h-1.08l-.34 1.14-1.1.3-.8-.94-.84.68.68 1-.9.8.22 1.04-.98.56v1.12l.98.56.22 1.04.9.8-.68 1 .84.68.8-.94 1.1.3.34 1.14h1.08l.34-1.14 1.1-.3.8.94.84-.68-.68-1 .9-.8.22-1.04.98-.56V9.32l-.98-.56zM16.16 13a2.88 2.88 0 1 1 0-5.76 2.88 2.88 0 0 1 0 5.76z"/>
      </svg>
    )
  }
  // Generic
  return (
    <span className="size-5 shrink-0 flex items-center justify-center rounded bg-secondary border border-border">
      <Wallet className="size-3 text-muted-foreground" />
    </span>
  )
}

export function WalletButton() {
  const router = useRouter()
  const { connectors, connect, isPending: isConnecting } = useConnect()
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const [open, setOpen] = useState(false)
  const [siweLoading, setSiweLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track whether SIWE was initiated from this component
  const pendingSiwe = useRef(false)

  // When wallet finishes connecting and we initiated it, run SIWE
  useEffect(() => {
    if (!isConnected || !address || !chain || !pendingSiwe.current) return
    pendingSiwe.current = false
    runSiwe(address, chain.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, chain])

  async function runSiwe(addr: string, chainId: number) {
    setSiweLoading(true)
    setError(null)
    try {
      const [nonceRes, domainRes] = await Promise.all([
        authClient.siwe.getNonce({ walletAddress: addr as `0x${string}`, chainId }),
        fetch('/api/auth/siwe/domain').then(r => r.json() as Promise<{ domain: string }>),
      ])
      if (nonceRes.error) throw new Error(`Nonce error: ${nonceRes.error.message}`)

      const nonce    = (nonceRes.data as { nonce: string }).nonce
      const domain   = domainRes.domain
      const uri      = `https://${domain}`
      const issuedAt = new Date().toISOString()

      const message =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${addr}\n\n` +
        `Sign in to Verdict.\n\n` +
        `URI: ${uri}\n` +
        `Version: 1\n` +
        `Chain ID: ${chainId}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${issuedAt}`

      const signature = await signMessageAsync({ message })

      const verifyRes = await authClient.$fetch('/siwe/verify', {
        method: 'POST',
        body: { message, signature, walletAddress: addr, chainId },
        credentials: 'include',
      })
      if (verifyRes.error) {
        throw new Error((verifyRes.error as { message?: string }).message ?? 'Verification failed.')
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet sign-in failed.')
      disconnect()
    } finally {
      setSiweLoading(false)
    }
  }

  function handleConnect(connectorId: string) {
    setError(null)
    setOpen(false)
    const connector = connectors.find(c => c.id === connectorId)
    if (!connector) return
    pendingSiwe.current = true
    connect({ connector })
  }

  // Filter: always show coinbaseWallet; only show injected if window.ethereum exists
  const displayConnectors = connectors.filter(c => {
    if (c.type === 'walletConnect') return false
    if (c.id === 'injected') {
      // Only show if there's actually an injected provider
      return typeof window !== 'undefined' && !!(window as unknown as { ethereum?: unknown }).ethereum
    }
    return true
  })

  const isLoading = isConnecting || siweLoading

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => { setError(null); setOpen(v => !v) }}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-between gap-2.5 border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
      >
        <span className="flex items-center gap-2.5">
          {isLoading
            ? <Loader2 className="size-4 animate-spin" />
            : <Wallet className="size-4" aria-hidden="true" />}
          {siweLoading ? 'Signing in…' : isConnecting ? 'Connecting…' : 'Continue with Wallet'}
        </span>
        {!isLoading && (
          <ChevronDown
            className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        )}
      </button>

      {open && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-1 border border-border bg-background z-50 shadow-md">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              选择钱包
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {displayConnectors.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground text-center">
              未检测到钱包。{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                安装 MetaMask
              </a>
            </div>
          ) : (
            <ul>
              {displayConnectors.map(connector => (
                <li key={connector.id}>
                  <button
                    type="button"
                    onClick={() => handleConnect(connector.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <WalletIcon name={connector.name} iconUrl={(connector as { icon?: string }).icon} />
                    <span>{connector.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive border-l-2 border-destructive pl-3 py-1 mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
