'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function useBilling() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const activateTrial = async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/billing/trial')
      if (user) {
        setUser({ ...user, plan: 'PRO', planExpiresAt: data.planExpiresAt })
      }
      return true
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка активации триала')
      return false
    } finally {
      setLoading(false)
    }
  }

  const checkout = async (period: 'monthly' | 'yearly'): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/billing/checkout', { period })
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка создания платежа')
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async (): Promise<void> => {
    try {
      const { data } = await api.get('/billing/status')
      if (user) {
        setUser({ ...user, plan: data.plan, planExpiresAt: data.planExpiresAt })
      }
    } catch {}
  }

  return { activateTrial, checkout, refreshStatus, loading, error }
}
