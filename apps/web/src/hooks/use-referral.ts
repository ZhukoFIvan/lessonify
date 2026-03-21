'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

export interface ReferralStats {
  referralCode: string
  referralsCount: number
  totalEarned: number
  paidOut: number
  balance: number
  availableBalance: number
  hasPendingRequest: boolean
  earnings: {
    id: string
    earnAmount: number
    description: string | null
    paid: boolean
    createdAt: string
  }[]
}

export function useReferral() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    api.get<ReferralStats>('/referrals/stats')
      .then(r => setStats({ ...r.data, balance: r.data.availableBalance ?? 0 }))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const requestWithdrawal = async (cardDetails: string) => {
    await api.post('/referrals/withdraw', { cardDetails })
    refetch()
  }

  return { stats, loading, requestWithdrawal, refetch }
}
