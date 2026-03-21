'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

export interface CalendarSyncStatus {
  connected: boolean
  syncEnabled?: boolean
  lastSyncAt?: string
  googleCalendarId?: string
}

export function useCalendarSyncStatus() {
  const [status, setStatus] = useState<CalendarSyncStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/calendar/status')
      setStatus(data.data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { status, loading, refetch: fetch }
}

export function useCalendarSync() {
  const [loading, setLoading] = useState(false)

  async function connectCalendar(): Promise<void> {
    setLoading(true)
    try {
      const { data } = await api.get('/calendar/auth-url')
      window.location.href = data.data.url
    } finally {
      setLoading(false)
    }
  }

  async function disconnectCalendar(): Promise<void> {
    setLoading(true)
    try {
      await api.delete('/calendar/disconnect')
    } finally {
      setLoading(false)
    }
  }

  async function toggleSync(): Promise<boolean> {
    setLoading(true)
    try {
      const { data } = await api.patch('/calendar/sync-toggle')
      return data.data.syncEnabled
    } finally {
      setLoading(false)
    }
  }

  async function syncAll(): Promise<number> {
    setLoading(true)
    try {
      const { data } = await api.post('/calendar/sync-all')
      return data.data.synced
    } finally {
      setLoading(false)
    }
  }

  return { loading, connectCalendar, disconnectCalendar, toggleSync, syncAll }
}
