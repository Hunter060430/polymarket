'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, signIn } from '@/lib/auth-client'
import { Loader2, Wallet } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<null | 'google' | 'wallet'>(null)

  // ── Google ──────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError(null)
    setLoading('google')
    try {
      await signIn.social({ provider: 'google', callbackURL: '/' })
      // Google redirects away; loading spinner stays until redirect.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
      setLoading(null)
    }
  }

  // ── Wallet (SIWE) ───────────────────────────────────────────────────────
  async function handleWallet() {
    setError(null)
    setLoading('wallet')
    try {
      type EthProvider = {
        request: (a: { method: string; params?: unknown[] }) => Promise<unknown>
      }
      const eth = (window as unknown as { ethereum?: EthProvider }).ethereum
      if (!eth) {
        throw new Error(
          'No Ethereum wallet detected. Please install MetaMask or a compatible wallet extension.',
        )
      }

      // 1. Request wallet access
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[]
      const address = accounts[0]
      if (!address) throw new Error('No wallet account selected.')

      const chainIdHex = (await eth.request({ method: 'eth_chainId' })) as string
      const chainId = parseInt(chainIdHex, 16)

      // 2. Get nonce from Better Auth (same-origin fetch — baseURL = window.location.origin)
      const nonceRes = await authClient.siwe.getNonce({
        walletAddress: address as `0x${string}`,
        chainId,
      })
      if (nonceRes.error) {
        throw new Error(`Could not get nonce: ${nonceRes.error.message}`)
      }
      const nonce = (nonceRes.data as { nonce: string }).nonce

      // 3. Build EIP-4361 SIWE message
      const domain = window.location.host
      const uri = window.location.origin
      const issuedAt = new Date().toISOString()
      const message =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${address}\n\n` +
        `Sign in to Verdict.\n\n` +
        `URI: ${uri}\n` +
        `Version: 1\n` +
        `Chain ID: ${chainId}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${issuedAt}`

      // 4. Request signature
      const signature = (await eth.request({
        method: 'personal_sign',
        params: [message, address],
      })) as string

      // 5. Verify + create session — POST to same-origin auth endpoint
      const verifyRes = await authClient.$fetch('/siwe/verify', {
        method: 'POST',
        body: { message, signature, walletAddress: address, chainId },
        credentials: 'include',
      })
      if (verifyRes.error) {
        throw new Error(
          (verifyRes.error as { message?: string }).message ?? 'Signature rejected by server.',
        )
      }

      // 6. Success
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet sign-in failed.')
      setLoading(null)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="font-heading text-3xl font-light text-foreground mb-1">
        Welcome to Verdict
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Sign in to comment, vote, and track markets.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2.5 border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          {loading === 'google' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <button
          onClick={handleWallet}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2.5 border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          {loading === 'wallet' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wallet className="size-4" aria-hidden="true" />
          )}
          Continue with Wallet
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive border-l-2 border-destructive pl-3 py-1 mt-4">
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
        By signing in you agree to our{' '}
        <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </a>
        .
      </p>
    </div>
  )
}
