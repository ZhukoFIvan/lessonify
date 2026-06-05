'use client'

import { useAuthStore } from '@/store/auth.store'

interface BrandLogoProps {
  className?: string
  alt?: string
}

/**
 * Логотип бренда. PRO-подписчикам показываем «ультра»-версию геккона,
 * остальным — обычный логотип. Версия определяется по user.plan из стора.
 */
export function BrandLogo({ className, alt = 'Lessonify' }: BrandLogoProps) {
  const isPro = useAuthStore((s) => s.user?.plan === 'PRO')
  return <img src={isPro ? '/logo-ultra.png' : '/logo.png'} alt={alt} className={className} />
}
