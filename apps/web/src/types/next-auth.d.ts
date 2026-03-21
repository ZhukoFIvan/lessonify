import type { DefaultSession } from 'next-auth'
import type { UserRole } from '@tutorflow/types'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
      tutorId?: string
      studentId?: string
    }
  }

  interface User {
    id: string
    role: UserRole
    tutorId?: string
    studentId?: string
    accessToken: string
    avatarUrl?: string | null
    gender?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    accessTokenExpiry: number
    role: UserRole
    tutorId?: string
    studentId?: string
    userId: string
  }
}
