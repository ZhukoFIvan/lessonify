'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function usePromo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const apply = async (code: string): Promise<{ daysAdded: number } | null> => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/promo/apply', { code })
      // Обновляем пользователя в сторе
      if (user) setUser({ ...user, plan: 'PRO', planExpiresAt: data.data.planExpiresAt })
      return data.data
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка применения промокода')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { apply, loading, error }
}
