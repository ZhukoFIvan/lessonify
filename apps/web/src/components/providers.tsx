'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { GoogleOAuthProvider } from '@react-oauth/google'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'

interface ProvidersProps {
  children: ReactNode
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function Providers({ children }: ProvidersProps) {
  const inner = (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </NextThemesProvider>
  )

  if (!googleClientId) return inner

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {inner}
    </GoogleOAuthProvider>
  )
}
