import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@tutorflow/types'

type SafeUser = Omit<User, 'passwordHash'>

interface AuthState {
  user: SafeUser | null
  accessToken: string | null

  setUser: (user: SafeUser | null) => void
  setAccessToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'tf-auth',
      // Персистируем только профиль — accessToken не храним в localStorage
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
