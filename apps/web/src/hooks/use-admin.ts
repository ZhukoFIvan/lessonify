'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number
  totalTutors: number
  totalStudents: number
  proUsers: number
  activeProUsers: number
  blockedUsers: number
  pendingWithdrawals: number
  totalEarnings: number
  totalLessons: number
  lessonsThisMonth: number
  registrations7d: number
  registrations30d: number
  botConnections: number
  botLinked: number
  revenueTotal: number
  revenueThisMonth: number
  paidOrdersCount: number
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

export interface AdminOrder {
  id: string
  provider: string
  externalId: string
  plan: string
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED'
  createdAt: string
  user: { id: string; name: string; email: string }
}

export interface AdminOrdersResponse {
  items: AdminOrder[]
  total: number
  pages: number
  page: number
  summary: { revenueTotal: number; paidCount: number; pendingCount: number; failedCount: number }
}

export interface AdminBotStats {
  total: number
  linked: number
  tutorConnections: number
  studentConnections: number
  pendingCodes: number
  totalTutors: number
  tutorConversion: number
  recent: {
    id: string
    username: string | null
    firstName: string | null
    connectedAt: string
    target: { type: 'tutor' | 'student'; name: string | null; email: string | null }
  }[]
}

export interface AdminTutorListItem {
  id: string
  userId: string
  name: string
  email: string
  plan: 'FREE' | 'PRO'
  planExpiresAt: string | null
  isBlocked: boolean
  subjects: string[]
  createdAt: string
  studentsCount: number
  lessonsCount: number
}

export interface AdminTutorDetail {
  id: string
  name: string
  email: string
  userId: string
  plan: 'FREE' | 'PRO'
  planExpiresAt: string | null
  isBlocked: boolean
  subjects: string[]
  hourlyRate: number | null
  timezone: string
  createdAt: string
  lessonsCount: number
  completedCount: number
  revenue: number
  students: {
    id: string
    name: string
    email: string | null
    subject: string | null
    createdAt: string
    lessonsCount: number
  }[]
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

  const setPlan = async (id: string, plan: 'FREE' | 'PRO', opts?: { months?: number; days?: number }) => {
    await api.patch(`/admin/users/${id}/plan`, { plan, months: opts?.months, days: opts?.days })
    refetch()
  }

  const setRole = async (id: string, role: 'TUTOR' | 'STUDENT' | 'ADMIN') => {
    await api.patch(`/admin/users/${id}/role`, { role })
    refetch()
  }

  return { data, loading, blockUser, setPlan, setRole, refetch }
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

export function useAdminOrders(status: string, page: number) {
  const [data, setData] = useState<AdminOrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    api.get('/admin/orders', {
      params: { status: status !== 'ALL' ? status : undefined, page },
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [status, page])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, refetch }
}

export function useAdminBotStats() {
  const [stats, setStats] = useState<AdminBotStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AdminBotStats>('/admin/bot-stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}

export function useAdminTutors(search: string, page: number) {
  const [data, setData] = useState<{ tutors: AdminTutorListItem[]; total: number; pages: number; page: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    api.get('/admin/tutors', {
      params: { search: search || undefined, page },
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, refetch }
}

export function useAdminTutor(id: string) {
  const [tutor, setTutor] = useState<AdminTutorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<AdminTutorDetail>(`/admin/tutors/${id}`)
      .then(r => setTutor(r.data))
      .finally(() => setLoading(false))
  }, [id])

  return { tutor, loading }
}
