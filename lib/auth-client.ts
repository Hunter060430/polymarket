'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
  sessionOptions: { refetchOnWindowFocus: false },
})

export const { signIn, signUp, signOut, useSession } = authClient
