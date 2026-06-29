'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useConnect, useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { authClient } from '@/lib/auth-client'
import { Loader2, Wallet, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Wallet icon as inline SVG so we have no extra image deps
function WalletIcon({ name }: { name: string }) {
  const lower = name.toLowerCase()
  if (lower.includes('coinbase')) {
    return (
      <svg viewBox="0 0 32 32" className="size-5 shrink-0" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#0052FF" />
        <path fill="#fff" d="M16 7a9 9 0 1 0 0 18A9 9 0 0 0 16 7Zm0 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
        <rect fill="#fff" x="13" y="14.25" width="6" height="3.5" rx="1" />
      </svg>
    )
  }
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
  const [activeConnector, setActiveConnector] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runSiwe(addr: string, chainId: number) {
    setSiweLoading(true)
    setError(null)
    try {
      // 1. Get nonce + server-expected domain in parallel
      const [nonceRes, domainRes] = await Promise.all([
        authClient.siwe.getNonce({
          walletAddress: addr as `0x${string}`,
          chainId,
        }),
        fetch('/api/auth/siwe/domain').then(r => r.json() as Promise<{ domain: string }>),
      ])
      if (nonceRes.error) throw new Error(`Nonce error: ${nonceRes.error.message}`)

      const nonce  = (nonceRes.data as { nonce: string }).nonce
      const domain = domainRes.domain
      const uri    = `https://${domain}`
      const issuedAt = new Date().toISOString()

      // 2. Build EIP-4361 message
      const message =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${addr}\n\n` +
        `Sign in to Verdict.\n\n` +
        `URI: ${uri}\n` +
        `Version: 1\n` +
        `Chain ID: ${chainId}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${issuedAt}`

      // 3. Sign via Wagmi (routes through the connected wallet correctly)
      const signature = await signMessageAsync({ message })

      // 4. Verify with Better Auth
      const verifyRes = await authClient.$fetch('/siwe/verify', {
        method: 'POST',
        body: { message, signature, walletAddress: addr, chainId },
        credentials: 'include',
      })
      if (verifyRes.error) {
        throw new Error(
          (verifyRes.error as { message?: string }).message ?? 'Signature verification failed.',
        )
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet sign-in failed.')
      disconnect()
    } finally {
      setSiweLoading(false)
      setActiveConnector(null)
    }
  }

  // When a wallet connects, immediately run SIWE
  async function handleConnect(connectorId: string) {
    setError(null)
    setActiveConnector(connectorId)
    setOpen(false)
    const connector = connectors.find(c => c.id === connectorId)
    if (!connector) return

    try {
      await new Promise<void>((resolve, reject) => {
        connect(
          { connector },
          {
            onSuccess: () => resolve(),
            onError: (e) => reject(e),
          },
        )
      })
      // address/chain available after connect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed.')
      setActiveConnector(null)
    }
  }

  // Once connected (address + chain available), run SIWE automatically
  const [hasTriggeredSiwe, setHasTriggeredSiwe] = useState(false)
  if (isConnected && address && chain && !siweLoading && !hasTriggeredSiwe && activeConnector) {
    setHasTriggeredSiwe(true)
    runSiwe(address, chain.id)
  }
  // Reset trigger when disconnected
  if (!isConnected && hasTriggeredSiwe) setHasTriggeredSiwe(false)

  const availableConnectors = connectors.filter(c => c.type !== 'walletConnect')
  const isLoading = isConnecting || siweLoading

  return (
    <div className="relative w-full">
      {/* Main button */}
      <button
        type="button"
        onClick={() => {
          setError(null)
          setOpen(v => !v)
        }}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-between gap-2.5 border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
      >
        <span className="flex items-center gap-2.5">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wallet className="size-4" aria-hidden="true" />
          )}
          {siweLoading
            ? 'Signing in…'
            : isConnecting
              ? 'Connecting wallet…'
              : 'Continue with Wallet'}
        </span>
        {!isLoading && (
          <ChevronDown
            className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Wallet picker dropdown */}
      {open && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-1 border border-border bg-background z-50 shadow-md">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Choose wallet
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close wallet picker"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {availableConnectors.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground text-center">
              No wallet detected.{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Install MetaMask
              </a>
            </div>
          ) : (
            <ul>
              {availableConnectors.map(connector => (
                <li key={connector.id}>
                  <button
                    type="button"
                    onClick={() => handleConnect(connector.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <WalletIcon name={connector.name} />
                    <span>{connector.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p className="text-xs text-destructive border-l-2 border-destructive pl-3 py-1 mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
