'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import api from '@/lib/api'
import type { LessonWithStudent, LessonWithTutor } from '@tutorflow/types'

// ── Уроки на конкретный день ─────────────────────────────────────────────────

export function useDayLessons(date: Date) {
  const [lessons, setLessons] = useState<LessonWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateStr = format(date, 'yyyy-MM-dd')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/lessons?date=${dateStr}&limit=50`)
      setLessons(data.data)
    } catch {
      setError('Не удалось загрузить уроки')
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => { fetch() }, [fetch])

  return { lessons, loading, error, refetch: fetch }
}

// ── Ближайший урок ────────────────────────────────────────────────────────────

export function useNextLesson() {
  const [lesson, setLesson] = useState<LessonWithStudent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const dateStr = format(now, 'yyyy-MM-dd')

    api
      .get(`/lessons?date=${dateStr}&status=SCHEDULED&limit=20`)
      .then(({ data }) => {
        const upcoming = (data.data as LessonWithStudent[])
          .filter((l) => new Date(l.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        setLesson(upcoming[0] ?? null)
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false))
  }, [])

  return { lesson, loading }
}

// ── Следующий урок (ученик) ───────────────────────────────────────────────────

export function useStudentNextLesson() {
  const [lesson, setLesson] = useState<LessonWithTutor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const dateStr = format(now, 'yyyy-MM-dd')

    api
      .get(`/lessons/my?date=${dateStr}&status=SCHEDULED&limit=20`)
      .then(({ data }) => {
        const upcoming = (data.data as LessonWithTutor[])
          .filter((l) => new Date(l.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        setLesson(upcoming[0] ?? null)
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false))
  }, [])

  return { lesson, loading }
}

// ── Создать урок ─────────────────────────────────────────────────────────────

export function useCreateLesson() {
  const [loading, setLoading] = useState(false)

  async function createLesson(payload: {
    studentId: string
    subject: string
    startTime: string
    durationMinutes: number
    price: number
    notes?: string
  }) {
    setLoading(true)
    try {
      const { data } = await api.post('/lessons', payload)
      return data
    } finally {
      setLoading(false)
    }
  }

  return { createLesson, loading }
}

// ── Отметить оплату ──────────────────────────────────────────────────────────

export function usePayLesson() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function payLesson(lessonId: string, amount?: number) {
    setLoadingId(lessonId)
    try {
      await api.patch(`/payments/lessons/${lessonId}/pay`, { amount })
    } finally {
      setLoadingId(null)
    }
  }

  return { payLesson, loadingId }
}

// ── Отправить напоминание вручную ─────────────────────────────────────────────

export function useRemindLesson() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function remindLesson(lessonId: string) {
    setLoadingId(lessonId)
    try {
      await api.post(`/lessons/${lessonId}/remind`)
    } finally {
      setLoadingId(null)
    }
  }

  return { remindLesson, loadingId }
}
