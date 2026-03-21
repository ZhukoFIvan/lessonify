'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { DebtorStudent, PaymentSummary, MonthlyIncome } from '@tutorflow/types'

// ── Должники ─────────────────────────────────────────────────────────────────

export function useDebtors() {
  const [debtors, setDebtors] = useState<DebtorStudent[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/payments/debt')
      setDebtors(data.data)
    } catch {
      setDebtors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { debtors, loading, refetch: fetch }
}

// ── Оплатить все долги ученика ────────────────────────────────────────────────

export function usePayAllForStudent() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function payAll(studentId: string): Promise<{ count: number; total: number }> {
    setLoadingId(studentId)
    try {
      const { data } = await api.patch(`/payments/students/${studentId}/pay-all`)
      return data.data as { count: number; total: number }
    } finally {
      setLoadingId(null)
    }
  }

  return { payAll, loadingId }
}

// ── Финансовая сводка ─────────────────────────────────────────────────────────

export function usePaymentSummary(months = 6) {
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [chart, setChart] = useState<MonthlyIncome[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/payments/summary?months=${months}`)
      .then(({ data }) => {
        setSummary(data.data.current)
        setChart(data.data.chart)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [months])

  return { summary, chart, loading }
}
