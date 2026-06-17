'use client'

import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/components/ui/use-toast'
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/i18n/config'

// Засеваем куку языка из сохранённого в БД предпочтения, чтобы сервер сразу
// отрендерил интерфейс на нужном языке (кросс-девайс перенос выбора).
function seedLocaleCookie(locale?: string | null): void {
  if (!locale) return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
}

export function useAuth() {
  const t = useTranslations('toasts')
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
      throw new Error(t('invalidCredentials'))
    }

    const { data } = await res.json()

    // Сохраняем в Zustand
    setUser(data.user)
    setAccessToken(data.accessToken)
    seedLocaleCookie(data.user?.locale)

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
      throw new Error(err.error ?? t('googleLoginError'))
    }

    const { data } = await res.json()
    setUser(data.user)
    setAccessToken(data.accessToken)
    seedLocaleCookie(data.user?.locale)
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
      throw new Error(err.error ?? t('registerError'))
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
    locale?: 'ru' | 'en' | 'uk'
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
    toast({ variant: 'success', title: t('welcomeToLessonify') })
    router.push('/dashboard')
  }

  return { login, loginWithGoogle, register, logout, updateProfile, finishOnboarding }
}
