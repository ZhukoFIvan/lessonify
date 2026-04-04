'use client'

import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Восстанавливает accessToken при загрузке страницы.
 * Если user есть в localStorage но accessToken потерян (перезагрузка) —
 * вызывает /api/auth/refresh через httpOnly cookie.
 */
export function AuthInitializer() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const logout = useAuthStore((s) => s.logout)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Если нет user — незалогинен, ничего не делаем
    if (!user) return

    // Если accessToken уже есть — ничего не делаем
    if (accessToken) return

    // User есть но токена нет — восстанавливаем через refresh
    axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.data.accessToken)
      })
      .catch(() => {
        // Refresh провалился — сессия истекла, разлогиниваем
        logout()
        window.location.href = '/auth/login'
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
