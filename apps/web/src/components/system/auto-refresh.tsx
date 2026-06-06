'use client'

import { useEffect, useRef } from 'react'
import { useRefreshStore } from '@/store/refresh.store'

// Бампает «тик свежести» при возврате на вкладку, восстановлении сети и по лёгкому
// интервалу — чтобы расписание/дашборд подхватывали изменения (напр. урок,
// созданный голосом в боте) без ручного F5. Монтируется один раз в (main)-layout.
const POLL_MS = 30_000
const DEBOUNCE_MS = 2_000

export function AutoRefresh() {
  const bump = useRefreshStore((s) => s.bump)
  const last = useRef(0)

  useEffect(() => {
    const trigger = () => {
      const now = Date.now()
      if (now - last.current < DEBOUNCE_MS) return
      last.current = now
      bump()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') trigger()
    }

    window.addEventListener('focus', trigger)
    window.addEventListener('online', trigger)
    document.addEventListener('visibilitychange', onVisible)
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') trigger()
    }, POLL_MS)

    return () => {
      window.removeEventListener('focus', trigger)
      window.removeEventListener('online', trigger)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(id)
    }
  }, [bump])

  return null
}
