'use client'

import { createAuthClient } from 'better-auth/react'
import { siweClient } from 'better-auth/client/plugins'

// Use an empty baseURL so the client always calls /api/auth/* on the
// same origin as the page — this is critical in v0 preview environments
// where the runtime URL differs from BETTER_AUTH_URL (the production domain).
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
  plugins: [siweClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
