'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number
  totalTutors: number
  totalStudents: number
  proUsers: number
  blockedUsers: number
  pendingWithdrawals: number
  totalEarnings: number
  registrationData: { date: string; count: number }[]
  recentUsers: AdminUser[]
  recentWithdrawals: AdminWithdrawal[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'TUTOR' | 'STUDENT' | 'ADMIN'
  plan: 'FREE' | 'PRO'
  planExpiresAt: string | null
  isBlocked: boolean
  createdAt: string
  studentsCount?: number
  referralsCount?: number
}

export interface AdminWithdrawal {
  id: string
  userId: string
  amount: number
  cardDetails: string
  status: 'PENDING' | 'PAID' | 'REJECTED'
  adminNote: string | null
  createdAt: string
  processedAt: string | null
  user: { id: string; name: string; email: string }
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AdminStats>('/admin/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}

export function useAdminUsers(search: string, role: string, page: number) {
  const [data, setData] = useState<{ users: AdminUser[]; total: number; pages: number; page: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    api.get('/admin/users', {
      params: {
        search: search || undefined,
        role: role !== 'ALL' ? role : undefined,
        page,
      },
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [search, role, page])

  useEffect(() => { refetch() }, [refetch])

  const blockUser = async (id: string) => {
    await api.patch(`/admin/users/${id}/block`)
    refetch()
  }

  const setPlan = async (id: string, plan: 'FREE' | 'PRO', months?: number) => {
    await api.patch(`/admin/users/${id}/plan`, { plan, months })
    refetch()
  }

  return { data, loading, blockUser, setPlan, refetch }
}

export function useAdminWithdrawals(status: string, page: number) {
  const [data, setData] = useState<{ items: AdminWithdrawal[]; total: number; pages: number; page: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    api.get('/admin/withdrawals', {
      params: {
        status: status !== 'ALL' ? status : undefined,
        page,
      },
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [status, page])

  useEffect(() => { refetch() }, [refetch])

  const processWithdrawal = async (id: string, action: 'PAID' | 'REJECTED', adminNote?: string) => {
    await api.patch(`/admin/withdrawals/${id}/process`, { action, adminNote })
    refetch()
  }

  return { data, loading, processWithdrawal, refetch }
}
