'use client'

import { useEffect, useRef } from 'react'
import { useRefreshStore } from '@/store/refresh.store'

// Вызывает onRefresh при каждом «тике свежести» (фокус вкладки / онлайн / интервал),
// НЕ срабатывая на первом маунте — initial-загрузка остаётся за основным useEffect'ом.
// Используется для ТИХОГО фонового обновления (без флага loading), чтобы не мигать
// скелетонами при каждом возврате на вкладку.
export function useRefreshOnTick(onRefresh: () => void) {
  const tick = useRefreshStore((s) => s.tick)
  const mounted = useRef(false)
  const cb = useRef(onRefresh)
  cb.current = onRefresh

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    cb.current()
  }, [tick])
}
