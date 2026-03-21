'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

interface TutorSettings {
  id: string
  subjects: string[]
  hourlyRate: number | null
  timezone: string
  reminderBeforeLesson: number
  reminderAfterLesson: number
}

export function useTutorSettings() {
  const [settings, setSettings] = useState<TutorSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/auth/tutor')
      setSettings(data.data)
    } catch {
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { settings, loading, refetch: fetch }
}

export function useUpdateTutorSettings() {
  const [loading, setLoading] = useState(false)

  async function update(data: Partial<{
    subjects: string[]
    hourlyRate: number | null
    reminderBeforeLesson: number
    reminderAfterLesson: number
  }>): Promise<TutorSettings> {
    setLoading(true)
    try {
      const { data: res } = await api.patch('/auth/tutor', data)
      return res.data as TutorSettings
    } finally {
      setLoading(false)
    }
  }

  return { update, loading }
}
