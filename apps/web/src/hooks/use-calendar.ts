'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { LessonWithStudent, LessonWithTutor } from '@tutorflow/types'

// Универсальный тип урока (для репетитора или ученика)
type CalendarLesson = LessonWithStudent | LessonWithTutor

// ── Количество уроков по датам (для точек в полоске дат) ──────────────────────

export function useCalendarDots(centerDate: Date, spread = 20) {
  const [counts, setCounts] = useState<Map<string, CalendarLesson[]>>(new Map())
  const [loading, setLoading] = useState(true)

  // Студенты вызывают /lessons/my, репетиторы — /lessons
  const role = useAuthStore((s) => s.user?.role)
  const endpoint = role === 'STUDENT' ? '/lessons/my' : '/lessons'

  const from = useMemo(
    () => startOfDay(subDays(centerDate, spread)).toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [format(centerDate, 'yyyy-MM')], // Обновляем при смене месяца
  )

  const to = useMemo(
    () => endOfDay(addDays(centerDate, spread)).toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [format(centerDate, 'yyyy-MM')],
  )

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`${endpoint}?from=${from}&to=${to}&limit=200`)
      const map = new Map<string, CalendarLesson[]>()
      for (const lesson of data.data as CalendarLesson[]) {
        const key = format(new Date(lesson.startTime), 'yyyy-MM-dd')
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(lesson)
      }
      setCounts(map)
    } catch {
      setCounts(new Map())
    } finally {
      setLoading(false)
    }
  }, [from, to, endpoint])

  useEffect(() => { fetch() }, [fetch])

  return { counts, loading, refetch: fetch }
}

// ── Уроки выбранного дня ──────────────────────────────────────────────────────

export function useDayView(date: Date, allLessons: Map<string, CalendarLesson[]>) {
  const key = format(date, 'yyyy-MM-dd')
  const lessons = useMemo(
    () =>
      (allLessons.get(key) ?? []).sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [allLessons, key],
  )
  return lessons
}

// ── Массив дат для полоски ────────────────────────────────────────────────────

export function useDateStrip(centerDate: Date, total = 60) {
  return useMemo(() => {
    const half = Math.floor(total / 2)
    return Array.from({ length: total }, (_, i) => addDays(subDays(centerDate, half), i))
  }, [centerDate, total])
}
