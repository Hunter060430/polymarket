'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient, signIn, signUp } from '@/lib/auth-client'
import { Loader2, Mail, Wallet } from 'lucide-react'

type Mode = 'sign-in' | 'sign-up'

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

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<null | 'email' | 'google' | 'wallet'>(null)

  const isSignUp = mode === 'sign-up'

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading('email')
    try {
      if (isSignUp) {
        const { error } = await signUp.email({ email, password, name: name || email.split('@')[0] })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await signIn.email({ email, password })
        if (error) throw new Error(error.message)
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(null)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading('google')
    try {
      await signIn.social({ provider: 'google', callbackURL: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
      setLoading(null)
    }
  }

  async function handleWallet() {
    setError(null)
    setLoading('wallet')
    try {
      const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
      if (!eth) {
        throw new Error('No Ethereum wallet found. Install MetaMask or a compatible wallet.')
      }
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[]
      const address = accounts[0]
      if (!address) throw new Error('No wallet account selected.')

      const chainIdHex = (await eth.request({ method: 'eth_chainId' })) as string
      const chainId = parseInt(chainIdHex, 16)

      // 1. Get nonce from server
      const { data: nonceData, error: nonceErr } = await authClient.siwe.nonce({
        walletAddress: address,
        chainId,
      })
      if (nonceErr || !nonceData) throw new Error(nonceErr?.message || 'Could not get nonce.')

      // 2. Build SIWE message
      const domain = window.location.host
      const uri = window.location.origin
      const issuedAt = new Date().toISOString()
      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Verdict.\n\nURI: ${uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonceData.nonce}\nIssued At: ${issuedAt}`

      // 3. Sign
      const signature = (await eth.request({
        method: 'personal_sign',
        params: [message, address],
      })) as string

      // 4. Verify with server
      const { error: verifyErr } = await authClient.siwe.verify({
        message,
        signature,
        walletAddress: address,
        chainId,
      })
      if (verifyErr) throw new Error(verifyErr.message || 'Signature verification failed.')

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
        {isSignUp ? 'Create account' : 'Welcome back'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {isSignUp ? 'Join the Verdict community.' : 'Sign in to comment and vote.'}
      </p>

      {/* OAuth + wallet */}
      <div className="flex flex-col gap-2.5 mb-6">
        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2.5 border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          {loading === 'google' ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>
        <button
          onClick={handleWallet}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2.5 border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          {loading === 'wallet' ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" aria-hidden="true" />}
          Continue with Wallet
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email + password */}
      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        {isSignUp && (
          <input
            type="text"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
        />

        {error && (
          <p className="text-xs text-destructive border-l-2 border-destructive pl-3 py-1">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-4 py-3 text-xs tracking-[0.12em] uppercase font-medium hover:bg-primary transition-colors disabled:opacity-50 mt-1"
        >
          {loading === 'email' ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-3.5" aria-hidden="true" />}
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        {isSignUp ? 'Already have an account?' : 'New to Verdict?'}{' '}
        <Link
          href={isSignUp ? '/sign-in' : '/sign-up'}
          className="text-primary hover:underline underline-offset-4"
        >
          {isSignUp ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  )
}
