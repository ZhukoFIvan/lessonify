import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth ────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    // При Google OAuth — отправляем ID token на наш Express бэк
    async signIn({ account, user }) {
      if (account?.provider === 'google' && account.id_token) {
        try {
          const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: account.id_token }),
          })

          if (!res.ok) return false

          const { data } = await res.json()
          user.id = data.user.id
          user.role = data.user.role
          user.tutorId = data.user.tutorId
          user.studentId = data.user.studentId
          user.accessToken = data.accessToken
          user.avatarUrl = data.user.avatarUrl
        } catch {
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.tutorId = user.tutorId
        token.studentId = user.studentId
        token.accessToken = user.accessToken
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.id = token.userId
      session.user.role = token.role
      session.user.tutorId = token.tutorId
      session.user.studentId = token.studentId
      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  secret: process.env.NEXTAUTH_SECRET,
}
