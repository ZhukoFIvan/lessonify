'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/components/ui/use-toast'

export function useAuth() {
  const router = useRouter()
  const { setUser, setAccessToken, logout: clearStore } = useAuthStore()

  // ── Login с email/password ──────────────────────────────────────────────────

  async function login(email: string, password: string) {
    // Вызываем через proxy route — он устанавливает tf_refresh cookie в браузере
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Неверный email или пароль')
    }

    const { data } = await res.json()

    // Сохраняем в Zustand
    setUser(data.user)
    setAccessToken(data.accessToken)

    router.push(data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
    router.refresh()
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────

  async function loginWithGoogle(accessToken: string) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
      credentials: 'include',
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Ошибка входа через Google')
    }

    const { data } = await res.json()
    setUser(data.user)
    setAccessToken(data.accessToken)
    router.push('/dashboard')
    router.refresh()
  }

  // ── Register ────────────────────────────────────────────────────────────────

  async function register(data: {
    email: string
    password: string
    name: string
    role: 'TUTOR' | 'STUDENT'
    inviteToken?: string
  }) {
    // Вызываем через proxy route — он устанавливает tf_refresh cookie в браузере
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Ошибка регистрации')
    }

    const { data: resData } = await res.json()
    setUser(resData.user)
    setAccessToken(resData.accessToken)
    router.push('/onboarding')
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async function logout() {
    try {
      // Proxy route удаляет tf_refresh cookie и отзывает токен на бэкенде
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Продолжаем разлогин даже если не удалось
    }
    clearStore()
    // Удаляем NextAuth сессию если есть
    await signOut({ redirect: false })
    router.push('/auth/login')
    router.refresh()
  }

  // ── Update profile (онбординг / настройки) ──────────────────────────────────

  async function updateProfile(data: {
    name?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
    avatarUrl?: string | null
  }) {
    // Используем Axios с Bearer токеном из Zustand
    const { default: api } = await import('@/lib/api')
    const { data: res } = await api.patch('/auth/profile', data)
    setUser(res.data)
    return res.data
  }

  // ── Finish onboarding ────────────────────────────────────────────────────────

  async function finishOnboarding(data: {
    name: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    avatarUrl: string
  }) {
    await updateProfile(data)
    toast({ variant: 'success', title: 'Добро пожаловать в TutorFlow!' })
    router.push('/dashboard')
  }

  return { login, loginWithGoogle, register, logout, updateProfile, finishOnboarding }
}
