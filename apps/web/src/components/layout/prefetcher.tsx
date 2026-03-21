'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { STUDENT_TABS, TUTOR_TABS } from './constants'
import { useAuthStore } from '@/store/auth.store'

// Предзагружает все навигационные роуты при монтировании layout'а,
// чтобы переходы были мгновенными без сетевого запроса за RSC payload.
export function Prefetcher() {
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)

  useEffect(() => {
    const tabs = role === 'STUDENT' ? STUDENT_TABS : TUTOR_TABS
    tabs.forEach(({ href }) => router.prefetch(href))
  }, [role, router])

  return null
}
