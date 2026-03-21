'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

interface TelegramStatus {
  connected: boolean
  username: string | null
  firstName: string | null
}

// ── Статус подключения ────────────────────────────────────────────────────────

export function useTelegramStatus() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/telegram/status')
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

// ── Получить deep link ────────────────────────────────────────────────────────

export function useGetTelegramLink() {
  const [loading, setLoading] = useState(false)

  async function getLink(): Promise<{ deepLink: string; code: string }> {
    setLoading(true)
    try {
      const { data } = await api.get('/telegram/link')
      return data.data as { deepLink: string; code: string }
    } finally {
      setLoading(false)
    }
  }

  return { getLink, loading }
}

// ── Отключить Telegram ────────────────────────────────────────────────────────

export function useDisconnectTelegram() {
  const [loading, setLoading] = useState(false)

  async function disconnect(): Promise<void> {
    setLoading(true)
    try {
      await api.delete('/telegram/disconnect')
    } finally {
      setLoading(false)
    }
  }

  return { disconnect, loading }
}
